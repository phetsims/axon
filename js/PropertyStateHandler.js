// Copyright 2020, University of Colorado Boulder

/**
 * Responsible for handling Property-specific logic associated with setting PhET-iO state. This file will defer Properties
 * from taking their final value, and notifying on that value until after state has been set on every Property. It is
 * also responsible for keeping track of order dependencies between different Properties, and making sure that undeferral
 * and notifications go out in the appropriate orders. See https://github.com/phetsims/axon/issues/276 for implemetation details.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import axon from './axon.js';
import Property from './Property.js';
import PropertyStatePhase from './PropertyStatePhase.js';

class PropertyStateHandler {

  /**
   * @param {PhetioStateEngine} phetioStateEngine
   */
  constructor( phetioStateEngine ) {

    // Properties support setDeferred(). We defer setting their values so all changes take effect
    // at once. This keeps track of finalization actions (embodied in a PhaseCallback) that must take place after all
    // Property values have changed. This keeps track of both types of PropertyStatePhase: undeferring and notification.
    // @private {PhaseCallback[]}
    this.phaseCallbacks = [];

    // @private {OrderDependency} - Each constraint logs an order dependency in how Properties have to have their
    // values set and notifications sent.
    this.propertyOrderDependencies = [];

    // @private {Object.<phetioID:string, boolean} - only populated with true values. A map of the Properties that are
    // in this.propertyOrderDependencies.
    this.propertiesInOrderDependencies = {};

    // @public (PropertyStateHandlerTests read-only)
    this.initialized = false;
  }

  /**
   * @param {PhetioStateEngine} phetioStateEngine
   * @public
   */
  initialize( phetioStateEngine ) {
    assert && assert( !this.initialized, 'cannot initialize twice' );

    phetioStateEngine.onBeforeSetValueEmitter.addListener( phetioObject => {

      // withhold AXON/Property notifications until all values have been set to avoid inconsistent intermediate states,
      // see https://github.com/phetsims/phet-io-wrappers/issues/229
      // only do this if the PhetioObject is already not deferred
      if ( phetioObject instanceof Property && !phetioObject.isDeferred ) {
        phetioObject.setDeferred( true );
        const phetioID = phetioObject.tandem.phetioID;

        const listener = () => {
          const potentialListener = phetioObject.setDeferred( false );

          // Always add a PhaseCallback so that we can track the order dependency, even though setDeferred can return null.
          this.phaseCallbacks.push( new PhaseCallback( phetioID, potentialListener, PropertyStatePhase.NOTIFY ) );
        };
        this.phaseCallbacks.push( new PhaseCallback( phetioID, listener, PropertyStatePhase.UNDEFER ) );
      }
    } );

    phetioStateEngine.stateSetEmitter.addListener( state => {

      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties( Object.keys( state ) );
    } );

    phetioStateEngine.isSettingStateProperty.lazyLink( isSettingState => {
      assert && !isSettingState && assert( this.phaseCallbacks.length === 0, 'phaseCallbacks should have all been applied' );
    } );

    this.initialized = true;
  }

  /**
   * @private
   * @param {Property} property
   */
  validateInstrumentedProperty( property ) {
    assert && assert( property instanceof Property && property.isPhetioInstrumented(), `must be an instrumented Property: ${property}` );
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

    this.propertyOrderDependencies.push( new OrderDependency( beforeProperty.tandem.phetioID, beforePhase, afterProperty.tandem.phetioID, afterPhase ) );
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

    for ( let i = 0; i < this.propertyOrderDependencies.length; i++ ) {
      const propertyOrderDependency = this.propertyOrderDependencies[ i ];

      if ( propertyOrderDependency.usesPhetioID( property.tandem.phetioID ) ) {
        arrayRemove( this.propertyOrderDependencies, propertyOrderDependency );
        i--;
      }
    }
    delete this.propertiesInOrderDependencies[ property.tandem.phetioID ];
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

    // Ignore order dependencies that do not apply to the list of phetioIDs that are getting set this time. This is because
    // they do not apply to the list of phetioIDs passed in via state.
    const orderDependenciesToIgnore = [];
    for ( let j = 0; j < this.propertyOrderDependencies.length; j++ ) {
      const orderDependency = this.propertyOrderDependencies[ j ];

      // If either side of the order dependency is not in the state, then ignore the order dependency entirely
      if ( phetioIDsInState.indexOf( orderDependency.beforePhetioID ) === -1 ||
           phetioIDsInState.indexOf( orderDependency.afterPhetioID ) === -1 ) {
        orderDependenciesToIgnore.push( orderDependency );
      }
    }

    // {OrderDependency[]} - This list accounts for order dependencies the do not apply to the phetioIDs set in this setState() call
    const orderDependenciesToLookAt = _.without( this.propertyOrderDependencies, ...orderDependenciesToIgnore );

    // {Object.<string,boolean>} - true if a phetioID + phase pair has been applied, keys are the combination of
    // phetioIDs and phase, see PhaseCallback.getTerm()
    const completedPhases = {};

    // to support failing out instead of infinite loop
    let numberOfIterations = 0;

    // Normally we would like to undefer things before notify, but make sure this is done in accordance with the order dependencies.
    while ( this.phaseCallbacks.length > 0 ) {
      numberOfIterations++;

      // Error case logging
      if ( numberOfIterations > 5000 ) {
        this.errorInUndeferAndNotifyStep( completedPhases, orderDependenciesToLookAt );
      }

      // Try to undefer as much as possible before notifying
      this.attemptToApplyPhases( PropertyStatePhase.UNDEFER, completedPhases, orderDependenciesToLookAt );
      this.attemptToApplyPhases( PropertyStatePhase.NOTIFY, completedPhases, orderDependenciesToLookAt );
    }
  }

  /**
   * @param {Object.<string,boolean>} completedPhases
   * @param {OrderDependency[]} orderDependencies
   * @private
   */
  errorInUndeferAndNotifyStep( completedPhases, orderDependencies ) {

    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs = this.phaseCallbacks.map( item => item.phetioID + item.phase );
    const relevantOrderDependencies = orderDependencies.filter( orderDependency => {
      return stillToDoIDPhasePairs.indexOf( orderDependency.getBeforeTerm() ) >= 0 ||
             stillToDoIDPhasePairs.indexOf( orderDependency.getAfterTerm() ) >= 0;
    } );
    const completedPhasePairs = _.keys( completedPhases ).filter( completedID => {
      for ( let i = 0; i < relevantOrderDependencies.length; i++ ) {
        const relevantOrderDependency = relevantOrderDependencies[ i ];
        if ( relevantOrderDependency.usesPhetioID( completedID ) ) {
          return true;
        }
      }
      return false;
    } );

    let string = '';
    console.log( 'still to be undeferred', this.phaseCallbacks.filter( phaseCallback => phaseCallback.phase === PropertyStatePhase.UNDEFER ) );
    console.log( 'still to be notified', this.phaseCallbacks.filter( phaseCallback => phaseCallback.phase === PropertyStatePhase.NOTIFY ) );
    console.log( 'completed phase pairs that share phetioIDs', completedPhasePairs );
    console.log( 'order dependencies that apply to the still todos', relevantOrderDependencies );
    relevantOrderDependencies.forEach( orderDependency => {
      string += `${orderDependency.getBeforeTerm()}\t${orderDependency.getAfterTerm()}\n`;
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
   * Go through all phases still to be applied, and apply them if the order dependencies allow it. Only apply for the
   * particular phase provided. In general UNDEFER must occur before the same phetioID gets NOTIFY.
   * @private
   *
   * @param {PropertyStatePhase} phase - only apply PhaseCallbacks for this particular PropertyStatePhase
   * @param {Object.<string,boolean>} completedPhases - map that keeps track of completed phases
   * @param {OrderDependency[]} orderDependencies
   */
  attemptToApplyPhases( phase, completedPhases, orderDependencies ) {

    for ( let i = 0; i < this.phaseCallbacks.length; i++ ) {
      const phaseCallbackToPotentiallyApply = this.phaseCallbacks[ i ];

      // this.phaseCallbacks includes all phases, only try to
      // check the order dependencies to see if this has to be after something that is incomplete.
      if ( phaseCallbackToPotentiallyApply.phase === phase &&
           this.phetioIDCanApplyPhase( phaseCallbackToPotentiallyApply.phetioID, phase, completedPhases, orderDependencies ) ) {

        // Fire the listener;
        phaseCallbackToPotentiallyApply.listener();

        // Remove it from the master list so that it doesn't get called again.
        arrayRemove( this.phaseCallbacks, phaseCallbackToPotentiallyApply );

        // Keep track of all completed PhaseCallbacks
        completedPhases[ phaseCallbackToPotentiallyApply.getTerm() ] = true;

        i--; // Account for the element that was just removed by decrementing.
      }
    }
  }

  /**
   * @private
   * @param {string} phetioID
   * @param {PropertyStatePhase} phase
   * @param {Object.<string,boolean>} completedPhases - map that keeps track of completed phases
   * @param {OrderDependency[]} orderDependencies
   * @returns {boolean} - if the provided phase can be applied given the dependency order dependencies of the state engine.
   */
  phetioIDCanApplyPhase( phetioID, phase, completedPhases, orderDependencies ) {

    // Undefer must happen before notify
    if ( phase === PropertyStatePhase.NOTIFY && !completedPhases[ phetioID + PropertyStatePhase.UNDEFER ] ) {
      return false;
    }

    // check the order dependencies to see if this has to be after something that is incomplete.
    // all must pass
    for ( let i = 0; i < orderDependencies.length; i++ ) {
      const orderDependency = orderDependencies[ i ];
      if ( orderDependency.afterPhetioID === phetioID && orderDependency.afterPhase === phase ) {

        // check if the before phase for this order dependency has already been completed
        if ( !completedPhases[ orderDependency.getBeforeTerm() ] ) {
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

// POJSO for an order dependency. See registerPropertyOrderDependency
class OrderDependency {

  /**
   * @param {string} beforePhetioID
   * @param {PropertyStatePhase} beforePhase
   * @param {string} afterPhetioID
   * @param {PropertyStatePhase} afterPhase
   */
  constructor( beforePhetioID, beforePhase, afterPhetioID, afterPhase ) {

    // @public
    this.beforePhetioID = beforePhetioID;
    this.beforePhase = beforePhase;
    this.afterPhetioID = afterPhetioID;
    this.afterPhase = afterPhase;
  }

  /**
   * @public
   * @returns {string} - unique term for the before id/phase pair
   */
  getBeforeTerm() {
    return this.beforePhetioID + this.beforePhase;
  }

  /**
   * @public
   * @returns {string} - unique term for the before id/phase pair
   */
  getAfterTerm() {
    return this.afterPhetioID + this.afterPhase;
  }

  /**
   * @public
   * @param {string} phetioID
   * @returns {boolean} - if this order dependency uses the provided phetioID
   */
  usesPhetioID( phetioID ) {
    return this.beforePhetioID === phetioID || this.afterPhetioID === phetioID;
  }
}

axon.register( 'PropertyStateHandler', PropertyStateHandler );
export default PropertyStateHandler;