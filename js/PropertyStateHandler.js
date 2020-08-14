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
    this.phaseCallbackSets = new PhaseCallbackSets();

    // @private {Set.<string>} - only populated with true values. A map of the Properties that are
    // in this.propertyOrderDependencies.
    this.propertiesInOrderDependencies = new Set();

    // @private - each pair has a Map optimized for looking up based on the "before phetioID" and the "after phetioID"
    // of the dependency. Having a data structure set up for both directions of look-up makes each operation O(1). See https://github.com/phetsims/axon/issues/316
    this.undeferBeforeUndeferMapPair = new OrderDependencyMapPair( PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER );
    this.undeferBeforeNotifyMapPair = new OrderDependencyMapPair( PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY );
    this.notifyBeforeUndeferMapPair = new OrderDependencyMapPair( PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER );
    this.notifyBeforeNotifyMapPair = new OrderDependencyMapPair( PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY );

    // @private - keep a list of all map pairs for easier iteration
    this.mapPairs = [
      this.undeferBeforeUndeferMapPair,
      this.undeferBeforeNotifyMapPair,
      this.notifyBeforeUndeferMapPair,
      this.notifyBeforeNotifyMapPair
    ];

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
          this.phaseCallbackSets.addNotifyPhaseCallback( new PhaseCallback( phetioID, potentialListener, PropertyStatePhase.NOTIFY ) );
        };
        this.phaseCallbackSets.addUndeferPhaseCallback( new PhaseCallback( phetioID, listener, PropertyStatePhase.UNDEFER ) );
      }
    } );

    phetioStateEngine.stateSetEmitter.addListener( state => {

      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties( Object.keys( state ) );
    } );

    phetioStateEngine.isSettingStateProperty.lazyLink( isSettingState => {
      assert && !isSettingState && assert( this.phaseCallbackSets.size === 0, 'PhaseCallbacks should have all been applied' );
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
   * @param beforePhase
   * @param afterPhase
   * @returns {*}
   */
  getMapPairFromPhases( beforePhase, afterPhase ) {
    for ( let i = 0; i < this.mapPairs.length; i++ ) {
      const mapPair = this.mapPairs[ i ];
      if ( beforePhase === mapPair.beforePhase && afterPhase === mapPair.afterPhase ) {
        return mapPair;
      }
    }
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

    this.propertiesInOrderDependencies.add( beforeProperty.tandem.phetioID );
    this.propertiesInOrderDependencies.add( afterProperty.tandem.phetioID );

    const mapPair = this.getMapPairFromPhases( beforePhase, afterPhase );

    mapPair.addOrderDependency( beforeProperty.tandem.phetioID, afterProperty.tandem.phetioID );
  }

  /**
   * @param {Property} property - must be instrumented for PhET-iO
   * @returns {boolean} - true if Property is in any order dependency
   * @public
   */
  propertyInAnOrderDependency( property ) {
    this.validateInstrumentedProperty( property );
    return this.propertiesInOrderDependencies.has( property.tandem.phetioID );
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

    this.mapPairs.forEach( mapPair => {
      [ mapPair.beforeMap, mapPair.afterMap ].forEach( map => {
        if ( map.has( phetioIDToRemove ) ) {
          map.get( phetioIDToRemove ).forEach( phetioID => {
            const setOfAfterMapIDs = map.otherMap.get( phetioID );
            setOfAfterMapIDs && setOfAfterMapIDs.delete( phetioIDToRemove ); // TODO: if the set is empty, delete it from the map? https://github.com/phetsims/axon/issues/316
          } );
        }
        map.delete( phetioIDToRemove );
      } );
    } );

    // Look through every dependency and make sure the phetioID to remove has been completely removed.
    assertSlow && this.mapPairs.forEach( mapPair => {
      [ mapPair.beforeMap, mapPair.afterMap ].forEach( map => {
        for ( const [ key, valuePhetioIDs ] of map ) {
          assertSlow && assertSlow( key !== phetioIDToRemove, 'should not be a key' );
          assertSlow && assertSlow( !valuePhetioIDs.has( phetioIDToRemove ), 'should not be in a value list' );
        }
      } );
    } );
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

  /**
   * @param {Object.<string,boolean>} completedPhases
   * @private
   */
  errorInUndeferAndNotifyStep( completedPhases ) {

    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs = [];
    this.phaseCallbackSets.forEach( phaseCallback => stillToDoIDPhasePairs.push( phaseCallback.getTerm() ) );

    const relevantOrderDependencies = [];

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
    console.log( 'still to be undeferred', this.phaseCallbackSets.undeferSet );
    console.log( 'still to be notified', this.phaseCallbackSets.notifySet );
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
    this.mapPairs.forEach( mapPair => {
      for ( const [ , valueSet ] of mapPair.afterMap ) { // either map would work here.
        count += valueSet.size;
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

    // Get a list of the maps for this phase being applies.
    const mapsToCheck = [];
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

class OrderDependencyMapPair {

  /**
   * @param {PropertyStatePhase} beforePhase
   * @param {PropertyStatePhase} afterPhase
   */
  constructor( beforePhase, afterPhase ) {

    // @public (read-only) - fields for mass consumption
    this.beforeMap = new Map();
    this.beforeMap.beforePhase = beforePhase;
    this.beforeMap.afterPhase = beforePhase;

    this.afterMap = new Map();
    this.afterMap.beforePhase = beforePhase;
    this.afterMap.afterPhase = afterPhase;

    this.beforeMap.otherMap = this.afterMap;
    this.afterMap.otherMap = this.beforeMap;

    // Can be helpful while debugging
    this.beforeMap.varName = `${beforePhase}Before${afterPhase}Map`;
    this.afterMap.varName = `${afterPhase}After${beforePhase}Map`;

    this.beforePhase = beforePhase;
    this.afterPhase = afterPhase;
  }

  /**
   * Register an order dependency between two phetioIDs. This will add data to maps in "both direction". If accessing
   * with just the beforePhetioID, or with the afterPhetioID.
   * @public
   * @param {string} beforePhetioID
   * @param {string} afterPhetioID
   */
  addOrderDependency( beforePhetioID, afterPhetioID ) {
    if ( !this.beforeMap.has( beforePhetioID ) ) {
      this.beforeMap.set( beforePhetioID, new Set() );
    }
    this.beforeMap.get( beforePhetioID ).add( afterPhetioID );

    if ( !this.afterMap.has( afterPhetioID ) ) {
      this.afterMap.set( afterPhetioID, new Set() );
    }
    this.afterMap.get( afterPhetioID ).add( beforePhetioID );
  }
}

// POJSO to keep track of PhaseCallbacks while providing O(1) lookup time because it is built on Set
class PhaseCallbackSets {
  constructor() {

    // @public (read-only) {Set.<PhaseCallback>}
    this.undeferSet = new Set();
    this.notifySet = new Set();
  }

  /**
   * @public
   * @returns {number}
   */
  get size() {
    return this.undeferSet.size + this.notifySet.size;
  }

  /**
   * @public
   * @param {function} callback
   */
  forEach( callback ) {
    this.undeferSet.forEach( callback );
    this.notifySet.forEach( callback );
  }

  /**
   * @public
   * @param {PhaseCallback} phaseCallback
   */
  addUndeferPhaseCallback( phaseCallback ) {
    this.undeferSet.add( phaseCallback );
  }

  /**
   * @public
   * @param {PhaseCallback} phaseCallback
   */
  addNotifyPhaseCallback( phaseCallback ) {
    this.notifySet.add( phaseCallback );
  }

  /**
   * @public
   * @param {PropertyStatePhase} phase
   * @returns {Set.<PhaseCallback>}
   */
  getSetFromPhase( phase ) {
    return phase === PropertyStatePhase.NOTIFY ? this.notifySet : this.undeferSet;
  }
}

axon.register( 'PropertyStateHandler', PropertyStateHandler );
export default PropertyStateHandler;