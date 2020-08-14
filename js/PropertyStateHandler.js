// Copyright 2020, University of Colorado Boulder

/**
 * Responsible for handling Property-specific logic associated with setting PhET-iO state. This file will defer Properties
 * from taking their final value, and notifying on that value until after state has been set on every Property. It is
 * also responsible for keeping track of order dependencies between different Properties, and making sure that undeferral
 * and notifications go out in the appropriate orders. See https://github.com/phetsims/axon/issues/276 for implementation details.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import Property from './Property.js';
import PropertyStatePhase from './PropertyStatePhase.js';

class PropertyStateHandler {

  /**
   * @param {PhetioStateEngine} phetioStateEngine - not provided for tests
   */
  constructor( phetioStateEngine ) {

    // Properties support setDeferred(). We defer setting their values so all changes take effect
    // at once. This keeps track of finalization actions (embodied in a PhaseCallback) that must take place after all
    // Property values have changed. This keeps track of both types of PropertyStatePhase: undeferring and notification.
    // @private {Set.<PhaseCallback>}
    this.notifyPhaseCallbacksSet = new Set();
    this.undeferPhaseCallbacksSet = new Set();

    // @private {Object.<phetioID:string, boolean} - only populated with true values. A map of the Properties that are
    // in this.propertyOrderDependencies. TODO: we can probably get rid of this, or at least make it a Set, https://github.com/phetsims/axon/issues/316
    this.propertiesInOrderDependencies = {};

    // @private
    // OrderDependencyMap.<phetioID, Set.<phetioID> - values are a list of afterPhetioIDs that can be looked up in the corresponding "after Map"
    // TODO: can we link related map tuples (before/after pairs) to simplify some stuff, especially some usages of phasesToOrderDependencyMap before, https://github.com/phetsims/axon/issues/316
    this.undeferBeforeUndeferMap = new OrderDependencyMap( PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER, 'undeferBeforeUndeferMap' );
    this.undeferBeforeNotifyMap = new OrderDependencyMap( PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY, 'undeferBeforeNotifyMap' );
    this.notifyBeforeUndeferMap = new OrderDependencyMap( PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER, 'notifyBeforeUndeferMap' );
    this.notifyBeforeNotifyMap = new OrderDependencyMap( PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY, 'notifyBeforeNotifyMap' );

    // OrderDependencyMap.<phetioID, Set.<phetioID>> - we need a set here to improve unregistration time to O(1).
    this.undeferAfterUndeferMap = new OrderDependencyMap( PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER, 'undeferAfterUndeferMap' );
    this.undeferAfterNotifyMap = new OrderDependencyMap( PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER, 'undeferAfterNotifyMap' );
    this.notifyAfterUndeferMap = new OrderDependencyMap( PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY, 'notifyAfterUndeferMap' );
    this.notifyAfterNotifyMap = new OrderDependencyMap( PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY, 'notifyAfterNotifyMap' );

    // TODO: this is yet another data structure, do we need it? https://github.com/phetsims/axon/issues/316
    // Create a link between each before/after map pair to make look ups a bit easier
    this.undeferAfterUndeferMap.otherMap = this.undeferBeforeUndeferMap;
    this.notifyAfterUndeferMap.otherMap = this.undeferBeforeNotifyMap;
    this.undeferAfterNotifyMap.otherMap = this.notifyBeforeUndeferMap;
    this.notifyAfterNotifyMap.otherMap = this.notifyBeforeNotifyMap;

    this.undeferBeforeUndeferMap.otherMap = this.undeferAfterUndeferMap;
    this.undeferBeforeNotifyMap.otherMap = this.notifyAfterUndeferMap;
    this.notifyBeforeUndeferMap.otherMap = this.undeferAfterNotifyMap;
    this.notifyBeforeNotifyMap.otherMap = this.notifyAfterNotifyMap;

    // TODO: rename https://github.com/phetsims/axon/issues/316
    // @private
    this.afterMaps = [
      this.undeferAfterUndeferMap,
      this.notifyAfterUndeferMap,
      this.undeferAfterNotifyMap,
      this.notifyAfterNotifyMap
    ];

    // TODO: rename https://github.com/phetsims/axon/issues/316
    // @private
    this.beforeMaps = [
      this.undeferBeforeUndeferMap,
      this.undeferBeforeNotifyMap,
      this.notifyBeforeUndeferMap,
      this.notifyBeforeNotifyMap
    ];

    // @private - {Map.<PropertyStatePhase, Map.<PropertyStatePhase, {before: OrderDependencyMap, after: OrderDependencyMap}>>}
    // To map from PropetyStatePhases to the appropriate OrderDependencyMap needed
    this.phasesToOrderDependencyMap = new Map();
    const undeferMap = new Map();
    undeferMap.set( PropertyStatePhase.UNDEFER, {
      before: this.undeferBeforeUndeferMap,
      after: this.undeferAfterUndeferMap
    } );
    undeferMap.set( PropertyStatePhase.NOTIFY, {
      before: this.undeferBeforeNotifyMap,
      after: this.notifyAfterUndeferMap
    } );
    this.phasesToOrderDependencyMap.set( PropertyStatePhase.UNDEFER, undeferMap );
    const notifyMap = new Map();
    notifyMap.set( PropertyStatePhase.UNDEFER, {
      before: this.notifyBeforeUndeferMap,
      after: this.undeferAfterNotifyMap
    } );
    notifyMap.set( PropertyStatePhase.NOTIFY, {
      before: this.notifyBeforeNotifyMap,
      after: this.notifyAfterNotifyMap
    } );
    this.phasesToOrderDependencyMap.set( PropertyStatePhase.NOTIFY, notifyMap );

    // @public (PropertyStateHandlerTests read-only)
    this.initialized = false;
  }

  /**
   * @param {PhetioStateEngine} phetioStateEngine
   * @public
   */
  initialize( phetioStateEngine ) {
    assert && assert( !this.initialized, 'cannot initialize twice' );

    phetioStateEngine.onBeforeApplyStateEmitter.addListener( phetioObject => {

      // withhold AXON/Property notifications until all values have been set to avoid inconsistent intermediate states,
      // see https://github.com/phetsims/phet-io-wrappers/issues/229
      // only do this if the PhetioObject is already not deferred
      if ( phetioObject instanceof Property && !phetioObject.isDeferred ) {
        phetioObject.setDeferred( true );
        const phetioID = phetioObject.tandem.phetioID;

        const listener = () => {
          const potentialListener = phetioObject.setDeferred( false );

          // Always add a PhaseCallback so that we can track the order dependency, even though setDeferred can return null.
          this.notifyPhaseCallbacksSet.add( new PhaseCallback( phetioID, potentialListener, PropertyStatePhase.NOTIFY ) );
        };
        this.undeferPhaseCallbacksSet.add( new PhaseCallback( phetioID, listener, PropertyStatePhase.UNDEFER ) );
      }
    } );

    phetioStateEngine.stateSetEmitter.addListener( state => {

      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties( Object.keys( state ) );
    } );

    phetioStateEngine.isSettingStateProperty.lazyLink( isSettingState => {
      if ( !isSettingState ) {
        assert && assert( this.notifyPhaseCallbacksSet.size === 0, 'notify PhaseCallbacks should have all been applied' );
        assert && assert( this.undeferPhaseCallbacksSet.size === 0, 'undefer PhaseCallbacks should have all been applied' );
      }
    } );

    this.initialized = true;
  }

  /**
   * @private
   * @param {Property} property
   */
  validateInstrumentedProperty( property ) {
    assert && Tandem.VALIDATION && assert( property instanceof Property && property.isPhetioInstrumented(), `must be an instrumented Property: ${property}` );
  }

  /**
   * @private
   * @param {Property} property
   * @param {PropertyStatePhase} phase
   */
  validatePropertyPhasePair( property, phase ) {
    this.validateInstrumentedProperty( property );
    assert && assert( PropertyStatePhase.includes( phase ), `unexpected phase: ${phase}` );
  }

  /**
   * TODO: cleanup doc if this sticks around, https://github.com/phetsims/axon/issues/316
   * @private
   * @param beforeOrAfter - from which context, a map where keys are the beforePhetioIDs, or the afterPhetioIDs
   * @param beforePhase
   * @param afterPhase
   * @returns {*}
   */
  getMapFromPhases( beforeOrAfter, beforePhase, afterPhase ) {
    return this.phasesToOrderDependencyMap.get( beforePhase ).get( afterPhase )[ beforeOrAfter ];
  }

  /**
   * Register that one Property must have a "Phase" applied for PhET-iO state before another Property's Phase. A Phase
   * is an ending state in PhET-iO state set where Property values solidify, notifications for value changes are called.
   * The PhET-iO state engine will always undefer a Property before it notifies its listeners. This is for registering
   * two different Properties.
   * @public
   *
   * @param {Property} beforeProperty - the Property that needs to be set before the second; must be instrumented for PhET-iO
   * @param {PropertyStatePhase} beforePhase
   * @param {Property} afterProperty - must be instrumented for PhET-iO
   * @param {PropertyStatePhase} afterPhase
   */
  registerPhetioOrderDependency( beforeProperty, beforePhase, afterProperty, afterPhase ) {

    this.validatePropertyPhasePair( beforeProperty, beforePhase );
    this.validatePropertyPhasePair( afterProperty, afterPhase );
    assert && beforeProperty === afterProperty && assert( beforePhase !== afterPhase, 'cannot set same Property to same phase' );

    this.propertiesInOrderDependencies[ beforeProperty.tandem.phetioID ] = true;
    this.propertiesInOrderDependencies[ afterProperty.tandem.phetioID ] = true;

    const beforeMapToPopulate = this.getMapFromPhases( 'before', beforePhase, afterPhase );
    if ( !beforeMapToPopulate.has( beforeProperty.tandem.phetioID ) ) {
      beforeMapToPopulate.set( beforeProperty.tandem.phetioID, new Set() );
    }
    beforeMapToPopulate.get( beforeProperty.tandem.phetioID ).add( afterProperty.tandem.phetioID );

    const afterMapToPopulate = this.getMapFromPhases( 'after', beforePhase, afterPhase );
    if ( !afterMapToPopulate.has( afterProperty.tandem.phetioID ) ) {
      afterMapToPopulate.set( afterProperty.tandem.phetioID, new Set() );
    }
    afterMapToPopulate.get( afterProperty.tandem.phetioID ).add( beforeProperty.tandem.phetioID );
  }

  /**
   * @param {Property} property - must be instrumented for PhET-iO
   * @returns {boolean} - true if Property is in any order dependency
   * @public
   */
  propertyInAnOrderDependency( property ) {
    this.validateInstrumentedProperty( property );
    return !!this.propertiesInOrderDependencies[ property.tandem.phetioID ];
  }

  /**
   * Unregisters all order dependencies for the given Property
   * @param {Property} property - must be instrumented for PhET-iO
   * @public
   */
  unregisterOrderDependenciesForProperty( property ) {
    this.validateInstrumentedProperty( property );
    assert && assert( this.propertyInAnOrderDependency( property ), 'Property must be registered in an order dependency to be unregistered' );

    const phetioIDToRemove = property.tandem.phetioID;

    this.beforeMaps.forEach( beforeMap => {
      if ( beforeMap.has( phetioIDToRemove ) ) {
        beforeMap.get( phetioIDToRemove ).forEach( phetioID => {
          const setOfAfterMapIDs = beforeMap.otherMap.get( phetioID );
          setOfAfterMapIDs && setOfAfterMapIDs.delete( phetioIDToRemove ); // TODO: if the set is empty, delete it from the map? https://github.com/phetsims/axon/issues/316
        } );
      }
    } );
    this.beforeMaps.forEach( map => map.delete( phetioIDToRemove ) );

    this.afterMaps.forEach( afterMap => {
      if ( afterMap.has( phetioIDToRemove ) ) {
        afterMap.get( phetioIDToRemove ).forEach( phetioID => {
          const setOfBeforeMapIDs = afterMap.otherMap.get( phetioID );
          setOfBeforeMapIDs && setOfBeforeMapIDs.delete( phetioIDToRemove );
        } );
      }
    } );
    this.afterMaps.forEach( map => map.delete( phetioIDToRemove ) );

    if ( assertSlow ) {
      this.beforeMaps.forEach( map => {
        for ( const [ key, valuePhetioIDs ] of map ) {
          assertSlow && assertSlow( key !== phetioIDToRemove, 'should not be a before key' );
          assertSlow && assertSlow( !valuePhetioIDs.has( phetioIDToRemove ), 'should not be in a before value list' );
        }
      } );

      this.afterMaps.forEach( map => {
        for ( const [ key, valuePhetioIDSet ] of map ) {
          assertSlow && assertSlow( key !== phetioIDToRemove, 'should not be a before key' );
          assertSlow && assertSlow( !valuePhetioIDSet.has( phetioIDToRemove ), 'should not be in a before value list' );
        }
      } );
    }

    delete this.propertiesInOrderDependencies[ phetioIDToRemove ];
  }

  /**
   * Given registered Property Phase order dependencies, undefer all AXON/Property PhET-iO elements to take their
   * correct values and have each notify their listeners.
   *
   * @private
   * @param {string[]} phetioIDsInState - list of phetioIDs that were set in state
   */
  undeferAndNotifyProperties( phetioIDsInState ) {
    assert && assert( this.initialized, 'must be initialized before getting called' );

    // {Object.<string,boolean>} - true if a phetioID + phase pair has been applied, keys are the combination of
    // phetioIDs and phase, see PhaseCallback.getTerm()
    const completedPhases = {};

    // to support failing out instead of infinite loop
    let numberOfIterations = 0;

    // Normally we would like to undefer things before notify, but make sure this is done in accordance with the order dependencies.
    while ( this.notifyPhaseCallbacksSet.size > 0 || this.undeferPhaseCallbacksSet.size > 0 ) {
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

  /**
   * @param {Object.<string,boolean>} completedPhases
   * @private
   */
  errorInUndeferAndNotifyStep( completedPhases ) {

    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs = [];
    this.undeferPhaseCallbacksSet.forEach( phaseCallback => stillToDoIDPhasePairs.push( phaseCallback.getTerm() ) );
    this.notifyPhaseCallbacksSet.forEach( phaseCallback => stillToDoIDPhasePairs.push( phaseCallback.getTerm() ) );

    const relevantOrderDependencies = [];

    this.beforeMaps.forEach( map => {
      for ( const [ beforePhetioID, afterPhetioIDs ] of map ) {
        afterPhetioIDs.forEach( afterPhetioID => {
          const beforeTerm = beforePhetioID + map.beforePhase;
          const afterTerm = afterPhetioID + map.afterPhase;
          if ( stillToDoIDPhasePairs.includes( beforeTerm ) || stillToDoIDPhasePairs.includes( afterTerm ) ) {
            relevantOrderDependencies.push( {
              beforeTerm: beforeTerm,
              afterTerm: afterTerm
            } );
          }
        } );
      }
    } );

    const completedPhasePairs = _.keys( completedPhases ).filter( completedID => {
      for ( let i = 0; i < relevantOrderDependencies.length; i++ ) {
        const relevantOrderDependency = relevantOrderDependencies[ i ];

        // TODO: startsWith does not mean that it is the actual phetioID, it could be a parent. Perhaps we need to
        // TODO: be able to split the term back in half, or be more OO. https://github.com/phetsims/axon/issues/316
        if ( relevantOrderDependency.beforeTerm.startsWith( completedID ) || relevantOrderDependency.afterTerm.startsWith( completedID ) ) {
          return true;
        }
      }
      return false;
    } );

    let string = '';
    console.log( 'still to be undeferred', this.undeferPhaseCallbacksSet );
    console.log( 'still to be notified', this.notifyPhaseCallbacksSet );
    console.log( 'completed phase pairs that share phetioIDs', completedPhasePairs );
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
   * @public
   * @returns {number}
   */
  getNumberOfOrderDependencies() {
    let count = 0;
    this.afterMaps.forEach( map => {
      for ( const [ , value ] of map ) {
        count += value.size;
      }
    } );
    return count;
  }

  /**
   * Go through all phases still to be applied, and apply them if the order dependencies allow it. Only apply for the
   * particular phase provided. In general UNDEFER must occur before the same phetioID gets NOTIFY.
   * @private
   *
   * @param {PropertyStatePhase} phase - only apply PhaseCallbacks for this particular PropertyStatePhase
   * @param {Object.<string,boolean>} completedPhases - map that keeps track of completed phases
   * @param {string[]} phetioIDsInState
   */
  attemptToApplyPhases( phase, completedPhases, phetioIDsInState ) {

    const phaseCallbackSet = phase === PropertyStatePhase.NOTIFY ? this.notifyPhaseCallbacksSet : this.undeferPhaseCallbacksSet;

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
   * @private
   * @param {string} phetioID - think of this as the "afterPhetioID" since there may be some phases that need to be applied before it has this phase done.
   * @param {PropertyStatePhase} phase
   * @param {Object.<string,boolean>} completedPhases - map that keeps track of completed phases
   * @param {string[]} phetioIDsInState
   * @returns {boolean} - if the provided phase can be applied given the dependency order dependencies of the state engine.
   */
  phetioIDCanApplyPhase( phetioID, phase, completedPhases, phetioIDsInState ) {

    // Undefer must happen before notify
    if ( phase === PropertyStatePhase.NOTIFY && !completedPhases[ phetioID + PropertyStatePhase.UNDEFER ] ) {
      return false;
    }

    let mapsToCheck = [ this.undeferAfterUndeferMap, this.undeferAfterNotifyMap ];
    if ( phase === PropertyStatePhase.NOTIFY ) {
      mapsToCheck = [ this.notifyAfterUndeferMap, this.notifyAfterNotifyMap ];
    }

    // O(2)
    for ( let i = 0; i < mapsToCheck.length; i++ ) {
      const mapToCheck = mapsToCheck[ i ];
      if ( !mapToCheck.has( phetioID ) ) {
        return true;
      }
      const setOfThingsThatShouldComeFirst = mapToCheck.get( phetioID );

      // O(K) where K is the number of elements that should come before Property X
      for ( const beforePhetioID of setOfThingsThatShouldComeFirst ) {

        // check if the before phase for this order dependency has already been completed
        // Make sure that we only care about elements that were actually set during this state set
        // TODO: Array.includes here is bad for performance, we may need to make this a map of some sort, https://github.com/phetsims/axon/issues/316
        if ( !completedPhases[ beforePhetioID + mapToCheck.beforePhase ] &&
             phetioIDsInState.includes( beforePhetioID ) && phetioIDsInState.includes( phetioID ) ) {
          return false;
        }
      }
    }
    return true;
  }
}

// POJSO for a callback for a specific Phase in a Property's state set lifecycle. See undeferAndNotifyProperties()
class PhaseCallback {

  /**
   * @param {string} phetioID
   * @param {function|null} listener
   * @param {PropertyStatePhase} phase
   */
  constructor( phetioID, listener, phase ) {

    // @public
    this.phetioID = phetioID;
    this.phase = phase;
    this.listener = listener || _.noop;
  }

  /**
   * @public
   * @returns {string} - unique term for the id/phase pair
   */
  getTerm() {
    return this.phetioID + this.phase;
  }
}

class OrderDependencyMap extends Map {

  /**
   * @param {PropertyStatePhase} beforePhase
   * @param {PropertyStatePhase} afterPhase
   * @param {string} varName
   */
  constructor( beforePhase, afterPhase, varName ) {
    super();
    this.beforePhase = beforePhase;
    this.afterPhase = afterPhase;
    this.varName = varName; // useful while in development
  }
}

axon.register( 'PropertyStateHandler', PropertyStateHandler );
export default PropertyStateHandler;