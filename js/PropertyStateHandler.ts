// Copyright 2020-2023, University of Colorado Boulder

/**
 * Responsible for handling Property-specific logic associated with setting PhET-iO state. This file will defer Properties
 * from taking their final value, and notifying on that value until after state has been set on every Property. It is
 * also responsible for keeping track of order dependencies between different Properties, and making sure that undeferral
 * and notifications go out in the appropriate orders. See https://github.com/phetsims/axon/issues/276 for implementation details.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import axon from './axon.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import TEmitter from './TEmitter.js';
import { FullPhetioState } from '../../tandem/js/TandemConstants.js';

type PhetioStateEngineStub = {
  onBeforeApplyStateEmitter: TEmitter<[ PhetioObject ]>;
  stateSetEmitter: TEmitter<[ FullPhetioState, Tandem ]>;
  isSettingStateProperty: TReadOnlyProperty<boolean>;
};

type PhaseMap = {
  beforePhase: PropertyStatePhase;
  afterPhase: PropertyStatePhase;
  otherMap: PhaseMap;
} & Map<string, Set<string>>;

type OrderDependency = {
  beforeTerm: string;
  afterTerm: string;
};

class PropertyStateHandler {
  private readonly phaseCallbackSets: PhaseCallbackSets;
  private readonly undeferBeforeUndeferMapPair: OrderDependencyMapPair;
  private readonly undeferBeforeNotifyMapPair: OrderDependencyMapPair;
  private readonly notifyBeforeUndeferMapPair: OrderDependencyMapPair;
  private readonly notifyBeforeNotifyMapPair: OrderDependencyMapPair;
  private readonly mapPairs: OrderDependencyMapPair[];
  private initialized = false;

  public constructor() {

    // Properties support setDeferred(). We defer setting their values so all changes take effect
    // at once. This keeps track of finalization actions (embodied in a PhaseCallback) that must take place after all
    // Property values have changed. This keeps track of both types of PropertyStatePhase: undeferring and notification.
    this.phaseCallbackSets = new PhaseCallbackSets();

    // each pair has a Map optimized for looking up based on the "before phetioID" and the "after phetioID"
    // of the dependency. Having a data structure set up for both directions of look-up makes each operation O(1). See https://github.com/phetsims/axon/issues/316
    this.undeferBeforeUndeferMapPair = new OrderDependencyMapPair( PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER );
    this.undeferBeforeNotifyMapPair = new OrderDependencyMapPair( PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY );
    this.notifyBeforeUndeferMapPair = new OrderDependencyMapPair( PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER );
    this.notifyBeforeNotifyMapPair = new OrderDependencyMapPair( PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY );

    // keep a list of all map pairs for easier iteration
    this.mapPairs = [
      this.undeferBeforeUndeferMapPair,
      this.undeferBeforeNotifyMapPair,
      this.notifyBeforeUndeferMapPair,
      this.notifyBeforeNotifyMapPair
    ];
  }

  public initialize( phetioStateEngine: PhetioStateEngineStub ): void {
    assert && assert( !this.initialized, 'cannot initialize twice' );

    phetioStateEngine.onBeforeApplyStateEmitter.addListener( phetioObject => {

      // withhold AXON/Property notifications until all values have been set to avoid inconsistent intermediate states,
      // see https://github.com/phetsims/phet-io-wrappers/issues/229
      // only do this if the PhetioObject is already not deferred
      if ( phetioObject instanceof ReadOnlyProperty && !phetioObject.isDeferred ) {
        phetioObject.setDeferred( true );
        const phetioID = phetioObject.tandem.phetioID;

        const listener = () => {
          const potentialListener = phetioObject.setDeferred( false );

          // Always add a PhaseCallback so that we can track the order dependency, even though setDeferred can return null.
          this.phaseCallbackSets.addNotifyPhaseCallback( new PhaseCallback( phetioID, PropertyStatePhase.NOTIFY, potentialListener || _.noop ) );
        };
        this.phaseCallbackSets.addUndeferPhaseCallback( new PhaseCallback( phetioID, PropertyStatePhase.UNDEFER, listener ) );
      }
    } );

    phetioStateEngine.stateSetEmitter.addListener( state => {

      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties( new Set( Object.keys( state ) ) );
    } );

    phetioStateEngine.isSettingStateProperty.lazyLink( isSettingState => {
      assert && !isSettingState && assert( this.phaseCallbackSets.size === 0, 'PhaseCallbacks should have all been applied' );
    } );

    this.initialized = true;
  }

  private static validateInstrumentedProperty( property: ReadOnlyProperty<unknown> ): void {
    assert && Tandem.VALIDATION && assert( property instanceof ReadOnlyProperty && property.isPhetioInstrumented(), `must be an instrumented Property: ${property}` );
  }

  private validatePropertyPhasePair( property: ReadOnlyProperty<unknown>, phase: PropertyStatePhase ): void {
    PropertyStateHandler.validateInstrumentedProperty( property );
  }

  /**
   * Get the MapPair associated with the proved PropertyStatePhases
   */
  private getMapPairFromPhases( beforePhase: PropertyStatePhase, afterPhase: PropertyStatePhase ): OrderDependencyMapPair {
    const matchedPairs = this.mapPairs.filter( mapPair => beforePhase === mapPair.beforePhase && afterPhase === mapPair.afterPhase );
    assert && assert( matchedPairs.length === 1, 'one and only one map should match the provided phases' );
    return matchedPairs[ 0 ];
  }

  /**
   * Register that one Property must have a "Phase" applied for PhET-iO state before another Property's Phase. A Phase
   * is an ending state in PhET-iO state set where Property values solidify, notifications for value changes are called.
   * The PhET-iO state engine will always undefer a Property before it notifies its listeners. This is for registering
   * two different Properties.
   *
   * @param beforeProperty - the Property that needs to be set before the second; must be instrumented for PhET-iO
   * @param beforePhase
   * @param afterProperty - must be instrumented for PhET-iO
   * @param afterPhase
   */
  public registerPhetioOrderDependency( beforeProperty: ReadOnlyProperty<IntentionalAny>,
                                        beforePhase: PropertyStatePhase, afterProperty: ReadOnlyProperty<IntentionalAny>,
                                        afterPhase: PropertyStatePhase ): void {
    if ( Tandem.PHET_IO_ENABLED ) {

      this.validatePropertyPhasePair( beforeProperty, beforePhase );
      this.validatePropertyPhasePair( afterProperty, afterPhase );
      assert && beforeProperty === afterProperty && assert( beforePhase !== afterPhase, 'cannot set same Property to same phase' );

      const mapPair = this.getMapPairFromPhases( beforePhase, afterPhase );

      mapPair.addOrderDependency( beforeProperty.tandem.phetioID, afterProperty.tandem.phetioID );
    }
  }

  /**
   * {Property} property - must be instrumented for PhET-iO
   * {boolean} - true if Property is in any order dependency
   */
  private propertyInAnOrderDependency( property: ReadOnlyProperty<unknown> ): boolean {
    PropertyStateHandler.validateInstrumentedProperty( property );
    return _.some( this.mapPairs, mapPair => mapPair.usesPhetioID( property.tandem.phetioID ) );
  }

  /**
   * Unregisters all order dependencies for the given Property
   * {ReadOnlyProperty} property - must be instrumented for PhET-iO
   */
  public unregisterOrderDependenciesForProperty( property: ReadOnlyProperty<IntentionalAny> ): void {
    if ( Tandem.PHET_IO_ENABLED ) {
      PropertyStateHandler.validateInstrumentedProperty( property );

      // Be graceful if given a Property that is not registered in an order dependency.
      if ( this.propertyInAnOrderDependency( property ) ) {
        assert && assert( this.propertyInAnOrderDependency( property ), 'Property must be registered in an order dependency to be unregistered' );

        this.mapPairs.forEach( mapPair => mapPair.unregisterOrderDependenciesForProperty( property ) );
      }
    }
  }

  /**
   * Given registered Property Phase order dependencies, undefer all AXON/Property PhET-iO elements to take their
   * correct values and have each notify their listeners.
   * {Set.<string>} phetioIDsInState - set of phetioIDs that were set in state
   */
  private undeferAndNotifyProperties( phetioIDsInState: Set<string> ): void {
    assert && assert( this.initialized, 'must be initialized before getting called' );

    // {Object.<string,boolean>} - true if a phetioID + phase pair has been applied, keys are the combination of
    // phetioIDs and phase, see PhaseCallback.getTerm()
    const completedPhases = {};

    // to support failing out instead of infinite loop
    let numberOfIterations = 0;

    // Normally we would like to undefer things before notify, but make sure this is done in accordance with the order dependencies.
    while ( this.phaseCallbackSets.size > 0 ) {
      numberOfIterations++;

      // Error case logging
      if ( numberOfIterations > 5000 ) {
        this.errorInUndeferAndNotifyStep( completedPhases );
      }

      // Try to undefer as much as possible before notifying
      this.attemptToApplyPhases( PropertyStatePhase.UNDEFER, completedPhases, phetioIDsInState );
      this.attemptToApplyPhases( PropertyStatePhase.NOTIFY, completedPhases, phetioIDsInState );
    }
  }


  private errorInUndeferAndNotifyStep( completedPhases: Record<string, boolean> ): void {

    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs: Array<string> = [];
    this.phaseCallbackSets.forEach( phaseCallback => stillToDoIDPhasePairs.push( phaseCallback.getTerm() ) );

    const relevantOrderDependencies: Array<OrderDependency> = [];

    this.mapPairs.forEach( mapPair => {
      const beforeMap = mapPair.beforeMap;
      for ( const [ beforePhetioID, afterPhetioIDs ] of beforeMap ) {
        afterPhetioIDs.forEach( afterPhetioID => {
          const beforeTerm = beforePhetioID + beforeMap.beforePhase;
          const afterTerm = afterPhetioID + beforeMap.afterPhase;
          if ( stillToDoIDPhasePairs.includes( beforeTerm ) || stillToDoIDPhasePairs.includes( afterTerm ) ) {
            relevantOrderDependencies.push( {
              beforeTerm: beforeTerm,
              afterTerm: afterTerm
            } );
          }
        } );
      }
    } );

    let string = '';
    console.log( 'still to be undeferred', this.phaseCallbackSets.undeferSet );
    console.log( 'still to be notified', this.phaseCallbackSets.notifySet );
    console.log( 'order dependencies that apply to the still todos', relevantOrderDependencies );
    relevantOrderDependencies.forEach( orderDependency => {
      string += `${orderDependency.beforeTerm}\t${orderDependency.afterTerm}\n`;
    } );
    console.log( '\n\nin graphable form:\n\n', string );

    const assertMessage = 'Impossible set state: from undeferAndNotifyProperties; ordering constraints cannot be satisfied';
    assert && assert( false, assertMessage );

    // We must exit here even if assertions are disabled so it wouldn't lock up the browser.
    if ( !assert ) {
      throw new Error( assertMessage );
    }
  }

  /**
   * Only for Testing!
   * Get the number of order dependencies registered in this class
   *
   */
  public getNumberOfOrderDependencies(): number {
    let count = 0;
    this.mapPairs.forEach( mapPair => {
      mapPair.afterMap.forEach( valueSet => { count += valueSet.size; } );
    } );
    return count;
  }

  /**
   * Go through all phases still to be applied, and apply them if the order dependencies allow it. Only apply for the
   * particular phase provided. In general UNDEFER must occur before the same phetioID gets NOTIFY.
   *
   * @param phase - only apply PhaseCallbacks for this particular PropertyStatePhase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   */
  private attemptToApplyPhases( phase: PropertyStatePhase, completedPhases: Record<string, boolean>, phetioIDsInState: Set<string> ): void {

    const phaseCallbackSet = this.phaseCallbackSets.getSetFromPhase( phase );

    for ( const phaseCallbackToPotentiallyApply of phaseCallbackSet ) {

      assert && assert( phaseCallbackToPotentiallyApply.phase === phase, 'phaseCallbackSet should only include callbacks for provided phase' );

      // only try to check the order dependencies to see if this has to be after something that is incomplete.
      if ( this.phetioIDCanApplyPhase( phaseCallbackToPotentiallyApply.phetioID, phase, completedPhases, phetioIDsInState ) ) {

        // Fire the listener;
        phaseCallbackToPotentiallyApply.listener();

        // Remove it from the master list so that it doesn't get called again.
        phaseCallbackSet.delete( phaseCallbackToPotentiallyApply );

        // Keep track of all completed PhaseCallbacks
        completedPhases[ phaseCallbackToPotentiallyApply.getTerm() ] = true;
      }
    }
  }

  /**
   * @param phetioID - think of this as the "afterPhetioID" since there may be some phases that need to be applied before it has this phase done.
   * @param phase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   * @param - if the provided phase can be applied given the dependency order dependencies of the state engine.
   */
  private phetioIDCanApplyPhase( phetioID: string, phase: PropertyStatePhase, completedPhases: Record<string, boolean>, phetioIDsInState: Set<string> ): boolean {

    // Undefer must happen before notify
    if ( phase === PropertyStatePhase.NOTIFY && !completedPhases[ phetioID + PropertyStatePhase.UNDEFER ] ) {
      return false;
    }

    // Get a list of the maps for this phase being applies.
    const mapsToCheck: Array<PhaseMap> = [];
    this.mapPairs.forEach( mapPair => {
      if ( mapPair.afterPhase === phase ) {

        // Use the "afterMap" because below looks up what needs to come before.
        mapsToCheck.push( mapPair.afterMap );
      }
    } );

    // O(2)
    for ( let i = 0; i < mapsToCheck.length; i++ ) {
      const mapToCheck = mapsToCheck[ i ];
      if ( !mapToCheck.has( phetioID ) ) {
        return true;
      }
      const setOfThingsThatShouldComeFirst = mapToCheck.get( phetioID );
      assert && assert( setOfThingsThatShouldComeFirst, 'must have this set' );

      // O(K) where K is the number of elements that should come before Property X
      for ( const beforePhetioID of setOfThingsThatShouldComeFirst! ) {

        // check if the before phase for this order dependency has already been completed
        // Make sure that we only care about elements that were actually set during this state set
        if ( !completedPhases[ beforePhetioID + mapToCheck.beforePhase ] &&
             phetioIDsInState.has( beforePhetioID ) && phetioIDsInState.has( phetioID ) ) {
          return false;
        }
      }
    }
    return true;
  }
}

// POJSO for a callback for a specific Phase in a Property's state set lifecycle. See undeferAndNotifyProperties()
class PhaseCallback {
  public constructor(
    public readonly phetioID: string,
    public readonly phase: PropertyStatePhase,
    public readonly listener: ( () => void ) = _.noop ) {
  }

  /**
   * {string} - unique term for the id/phase pair
   */
  public getTerm(): string {
    return this.phetioID + this.phase;
  }
}

class OrderDependencyMapPair {

  public readonly beforeMap: PhaseMap;
  public readonly afterMap: PhaseMap;
  public readonly beforePhase: PropertyStatePhase;
  public readonly afterPhase: PropertyStatePhase;

  public constructor( beforePhase: PropertyStatePhase, afterPhase: PropertyStatePhase ) {

    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.beforeMap = new Map();
    this.beforeMap.beforePhase = beforePhase;
    this.beforeMap.afterPhase = afterPhase;

    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.afterMap = new Map();
    this.afterMap.beforePhase = beforePhase;
    this.afterMap.afterPhase = afterPhase;

    this.beforeMap.otherMap = this.afterMap;
    this.afterMap.otherMap = this.beforeMap;

    this.beforePhase = beforePhase;
    this.afterPhase = afterPhase;
  }

  /**
   * Register an order dependency between two phetioIDs. This will add data to maps in "both direction". If accessing
   * with just the beforePhetioID, or with the afterPhetioID.
   */
  public addOrderDependency( beforePhetioID: string, afterPhetioID: string ): void {
    if ( !this.beforeMap.has( beforePhetioID ) ) {
      this.beforeMap.set( beforePhetioID, new Set<string>() );
    }
    this.beforeMap.get( beforePhetioID )!.add( afterPhetioID );

    if ( !this.afterMap.has( afterPhetioID ) ) {
      this.afterMap.set( afterPhetioID, new Set() );
    }
    this.afterMap.get( afterPhetioID )!.add( beforePhetioID );
  }

  /**
   * Unregister all order dependencies for the provided Property
   */
  public unregisterOrderDependenciesForProperty( property: ReadOnlyProperty<unknown> ): void {
    const phetioIDToRemove = property.tandem.phetioID;

    [ this.beforeMap, this.afterMap ].forEach( map => {
      map.has( phetioIDToRemove ) && map.get( phetioIDToRemove )!.forEach( phetioID => {
        const setOfAfterMapIDs = map.otherMap.get( phetioID );
        setOfAfterMapIDs && setOfAfterMapIDs.delete( phetioIDToRemove );

        // Clear out empty entries to avoid having lots of empty Sets sitting around
        setOfAfterMapIDs!.size === 0 && map.otherMap.delete( phetioID );
      } );
      map.delete( phetioIDToRemove );
    } );

    // Look through every dependency and make sure the phetioID to remove has been completely removed.
    assertSlow && [ this.beforeMap, this.afterMap ].forEach( map => {
      map.forEach( ( valuePhetioIDs, key ) => {
        assertSlow && assertSlow( key !== phetioIDToRemove, 'should not be a key' );
        assertSlow && assertSlow( !valuePhetioIDs.has( phetioIDToRemove ), 'should not be in a value list' );
      } );
    } );
  }

  public usesPhetioID( phetioID: string ): boolean {
    return this.beforeMap.has( phetioID ) || this.afterMap.has( phetioID );
  }
}

// POJSO to keep track of PhaseCallbacks while providing O(1) lookup time because it is built on Set
class PhaseCallbackSets {
  public readonly undeferSet = new Set<PhaseCallback>();
  public readonly notifySet = new Set<PhaseCallback>();

  public get size(): number {
    return this.undeferSet.size + this.notifySet.size;
  }

  public forEach( callback: ( phaseCallback: PhaseCallback ) => number ): void {
    this.undeferSet.forEach( callback );
    this.notifySet.forEach( callback );
  }

  public addUndeferPhaseCallback( phaseCallback: PhaseCallback ): void {
    this.undeferSet.add( phaseCallback );
  }

  public addNotifyPhaseCallback( phaseCallback: PhaseCallback ): void {
    this.notifySet.add( phaseCallback );
  }

  public getSetFromPhase( phase: PropertyStatePhase ): Set<PhaseCallback> {
    return phase === PropertyStatePhase.NOTIFY ? this.notifySet : this.undeferSet;
  }
}

axon.register( 'PropertyStateHandler', PropertyStateHandler );
export default PropertyStateHandler;