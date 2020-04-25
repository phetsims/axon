// Copyright 2013-2020, University of Colorado Boulder

/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import axon from './axon.js';
import Multilink from './Multilink.js';
import TinyEmitter from './TinyEmitter.js';
import units from './units.js';
import validate from './validate.js';
import ValidatorDef from './ValidatorDef.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// variables
let globalId = 0; // autoincremented for unique IDs

class Property extends PhetioObject {

  /**
   * @param {*} value - the initial value of the property
   * @param {Object} [options] - options
   */
  constructor( value, options ) {
    options = merge( {

      tandem: Tandem.OPTIONAL, // workaround for https://github.com/phetsims/tandem/issues/50

      // useDeepEquality: true => Use the `equals` method on the values
      // useDeepEquality: false => Use === for equality test
      useDeepEquality: false,

      // {string|null} units for the number, see units.js. Should prefer abbreviated units, see https://github.com/phetsims/phet-io/issues/530
      units: null,

      // {boolean} Whether reentrant calls to 'set' are allowed.
      // Use this to detect or prevent update cycles. Update cycles may be due to floating point error,
      // faulty logic, etc. This may be of particular interest for PhET-iO instrumentation, where such
      // cycles may pollute the data stream. See https://github.com/phetsims/axon/issues/179
      reentrant: false

      // Property also supports validator options, see ValidatorDef.VALIDATOR_KEYS.

    }, options );

    // Support non-validated Property
    if ( !ValidatorDef.containsValidatorKey( options ) ) {
      options.isValidValue = () => true;
    }

    assert && options.units && assert( units.isValidUnits( options.units ), 'invalid units: ' + options.units );
    if ( options.units ) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};
      assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'units' ), 'units should be supplied by Property, not elsewhere' );
      options.phetioEventMetadata.units = options.units;
    }

    super( options );

    // @public {number} - Unique identifier for this Property.
    this.id = globalId++;

    // @public (phet-io) Units, if any.  See units.js for valid values
    this.units = options.units;

    // @private (read-only) whether to use the values' equals method or === equality
    // useDeepEquality: true => Use the `equals` method on the values
    // useDeepEquality: false => Use === for equality test
    this.useDeepEquality = options.useDeepEquality;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    if ( Tandem.errorOnFailedValidation() && this.isPhetioInstrumented() ) {

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( !!options.phetioType,
        'phetioType passed to Property must be specified. Tandem.phetioID: ' + this.tandem.phetioID );

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( !!options.phetioType.parameterTypes[ 0 ],
        'phetioType parameter type must be specified (only one). Tandem.phetioID: ' + this.tandem.phetioID );
    }

    // @private - Store the internal value and the initial value
    this._value = value;

    // @protected - Initial value
    this._initialValue = value;

    // @public (phet-io)
    this.validValues = options.validValues;

    // @private (unit-tests) - emit is called when the value changes (or on link)
    // Also used in ShapePlacementBoard.js at the moment
    // We are validating here in Property, so we don't need the sub-emitter to validate too.
    this.changedEmitter = new TinyEmitter();

    // @private whether we are in the process of notifying listeners
    this.notifying = false;

    // @private whether to allow reentry of calls to set
    this.reentrant = options.reentrant;

    // @public (read-only) - while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
    // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
    // send notifications.
    this.isDeferred = false;

    // @private {*} - the value that this Property will take after no longer deferred
    this.deferredValue = null;

    // @private {boolean} whether a deferred value has been set
    this.hasDeferredValue = false;

    // Assertions regarding value validation
    if ( assert ) {
      const validator = _.pick( options, ValidatorDef.VALIDATOR_KEYS );

      // Validate the value type's phetioType of the Property, not the PropertyIO itself.
      // For example, for PropertyIO( BooleanIO ), assign this validator's phetioType to be BooleanIO's validator.
      if ( validator.phetioType ) {
        assert( !!validator.phetioType.parameterTypes[ 0 ], 'unexpected number of parameters for Property' );
        validator.phetioType = validator.phetioType.parameterTypes[ 0 ];
      }
      ValidatorDef.validateValidator( validator );

      // validate the initial value as well as any changes in the future
      this.link( value => validate( value, validator, VALIDATE_OPTIONS_FALSE ) );
    }
  }

  /**
   * Gets the value.
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   * @public
   */
  get() {
    return this._value;
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * @param {*} value
   * @returns {Property} this instance, for chaining.
   * @public
   */
  set( value ) {
    if ( !this.isDisposed ) {
      if ( this.isDeferred ) {
        this.deferredValue = value;
        this.hasDeferredValue = true;
      }
      else if ( !this.equalsValue( value ) ) {
        const oldValue = this.get();
        this.setPropertyValue( value );
        this._notifyListeners( oldValue );
      }
    }
    return this;
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   *
   * @param {*} value
   * @protected - for overriding only
   */
  setPropertyValue( value ) {
    this._value = value;
  }

  /**
   * Stores the specified value as the initial value, which will be taken on reset. Use sparingly!
   * @param {*} initialValue
   * @public (PhetioStateEngine)
   */
  setInitialValue( initialValue ) {
    this._initialValue = initialValue;
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   * @param {Object} value
   * @returns {boolean}
   * @protected
   */
  equalsValue( value ) {
    return this.areValuesEqual( value, this._value );
  }

  /**
   * Determines equality semantics for the wrapped type, including whether notifications are sent out when the
   * wrapped value changes, and whether onValue is triggered.
   *
   * useDeepEquality: true => Use the `equals` method on the values
   * useDeepEquality: false => Use === for equality test
   *
   * Alternatively different implementation can be provided by subclasses or instances to change the equals
   * definition. See #10 and #73 and #115
   * @param {Object} a - should have the same type as Property element type
   * @param {Object} b - should have the same type as Property element type
   * @returns {boolean}
   * @private
   */
  areValuesEqual( a, b ) {
    if ( this.useDeepEquality && a && b && a.constructor === b.constructor ) {

      assert && assert( !!a.equals, 'no equals function for 1st arg' );
      assert && assert( !!b.equals, 'no equals function for 2nd arg' );
      assert && assert( a.equals( b ) === b.equals( a ), 'incompatible equality checks' );
      return a.equals( b );
    }
    else {

      // Reference equality for objects, value equality for primitives
      return a === b;
    }
  }

  /**
   * Returns the initial value of this Property.
   * @public
   *
   * @returns {*}
   */
  getInitialValue() {
    return this._initialValue;
  }

  // @public
  get initialValue() {
    return this.getInitialValue();
  }

  /**
   * @param {*} oldValue
   * @private - but note that a few sims are calling this even though they shouldn't
   */
  _notifyListeners( oldValue ) {

    this.isPhetioInstrumented() && this.phetioStartEvent( Property.CHANGED_EVENT_NAME, {
      getData: () => {
        const parameterType = this.phetioType.parameterTypes[ 0 ];
        return {
          oldValue: NullableIO( parameterType ).toStateObject( oldValue ),
          newValue: parameterType.toStateObject( this.get() )
        };
      }
    } );

    // notify listeners, optionally detect loops where this Property is set again before this completes.
    assert && assert( !this.notifying || this.reentrant,
      'reentry detected, value=' + this.get() + ', oldValue=' + oldValue );
    this.notifying = true;
    this.changedEmitter.emit( this.get(), oldValue, this );
    this.notifying = false;

    this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  /**
   * Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
   * This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
   * This method is unsafe for removing listeners because it assumes the listener list not modified, to save another allocation
   * Only provides the new reference as a callback (no oldvalue)
   * See https://github.com/phetsims/axon/issues/6
   * @public
   */
  notifyListenersStatic() {
    this._notifyListeners( null );
  }

  /**
   * When deferred, set values do not take effect or send out notifications.  After defer ends, the Property takes
   * its deferred value (if any), and a follow-up action (return value) can be invoked to send out notifications
   * once other Properties have also taken their deferred values.
   *
   * @param {boolean} isDeferred - whether the Property should be deferred or not
   * @returns {function|null} - function to notify listeners after calling setDeferred(false),
   *                          - null if isDeferred is true, or if the value is unchanged since calling setDeferred(true)
   * @public
   */
  setDeferred( isDeferred ) {
    assert && assert( !this.isDisposed, 'cannot defer Property if already disposed.' );
    assert && assert( typeof isDeferred === 'boolean', 'bad value for isDeferred' );
    if ( isDeferred ) {
      assert && assert( !this.isDeferred, 'Property already deferred' );
      this.isDeferred = true;
    }
    else {
      assert && assert( this.isDeferred, 'Property wasn\'t deferred' );
      this.isDeferred = false;

      const oldValue = this._value;

      // Take the new value
      if ( this.hasDeferredValue ) {
        this.setPropertyValue( this.deferredValue );
        this.hasDeferredValue = false;
      }

      // If the value has changed, prepare to send out notifications (after all other Properties in this transaction
      // have their final values)
      if ( !this.equalsValue( oldValue ) ) {
        return () => !this.isDisposed && this._notifyListeners( oldValue );
      }
    }

    // no action to signify change
    return null;
  }

  /**
   * Resets the value to the initial value.
   * @public
   */
  reset() {
    this.set( this._initialValue );
  }

  // @public
  get value() { return this.get(); }

  // @public
  set value( newValue ) { this.set( newValue ); }

  /**
   * This function registers an order dependency between this Property and another. Basically this says that when
   * setting PhET-iO state, each dependency must take its final value before this Property fires its notifications.
   * See Property.registerOrderDependency and https://github.com/phetsims/axon/issues/276 for more info.
   * TODO: add a deregistrations, https://github.com/phetsims/axon/issues/276
   * @param {Property[]} dependencies
   * @private
   */
  addPhetioDependencies( dependencies ) {
    assert && assert( Array.isArray( dependencies ), 'Array expected' );
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];

      // The dependency should undefer (taking deferred value) before this Property notifies.
      Property.registerOrderDependency( dependency, Property.Phase.UNDEFER, this, Property.Phase.NOTIFY );
    }
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   * @param {Object} [options]
   * @public
   */
  link( listener, options ) {
    if ( options && options.phetioDependencies ) {
      this.addPhetioDependencies( options.phetioDependencies );
    }

    this.changedEmitter.addListener( listener );
    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the Property, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @param {function} listener - a function with a single argument, which is the current value of the Property.
   * @param {Object} [options]
   * @public
   */
  lazyLink( listener, options ) {
    if ( options && options.phetioDependencies ) {
      this.addPhetioDependencies( options.phetioDependencies );
    }
    this.changedEmitter.addListener( listener );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   *
   * @param {function} listener
   * @public
   */
  unlink( listener ) {
    this.changedEmitter.removeListener( listener );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   * @public
   */
  unlinkAll() {
    this.changedEmitter.removeAllListeners();
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * @param object
   * @param attributeName
   * @public
   */
  linkAttribute( object, attributeName ) {
    const handle = value => {object[ attributeName ] = value;};
    this.link( handle );
    return handle;
  }

  /**
   * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
   * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
   *
   * @param {function} listener
   * @public
   */
  unlinkAttribute( listener ) {
    this.unlink( listener );
  }

  /**
   * Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
   * @returns {string}
   * @override
   */
  toString() {return `Property#${this.id}{${this.get()}}`; }

  /**
   * @returns {string}
   */
  valueOf() {return this.toString();}

  /**
   * Convenience function for debugging a Property's value. It prints the new value on registration and when changed.
   * @param {string} name - debug name to be printed on the console
   * @returns {function} - the handle to the linked listener in case it needs to be removed later
   * @public
   */
  debug( name ) {
    const listener = value => console.log( name, value );
    this.link( listener );
    return listener;
  }

  /**
   * Modifies the value of this Property with the ! operator.  Works for booleans and non-booleans.
   * @public
   */
  toggle() {
    this.value = !this.value;
  }

  // @public Ensures that the Property is eligible for GC
  dispose() {

    // remove any listeners that are still attached to this property
    this.unlinkAll();

    // unregister any order dependencies for this property from the PhetioStateEngine
    if ( Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() ) {
      phet.phetio.phetioEngine.phetioStateEngine.unregisterOrderDependenciesForProperty( this );
    }

    super.dispose();
    this.changedEmitter.dispose();
  }

  /**
   * Checks whether a listener is registered with this Property
   * @param {function} listener
   * @returns {boolean}
   * @public
   */
  hasListener( listener ) {
    return this.changedEmitter.hasListener( listener );
  }

  /**
   * Returns true if there are any listeners.
   * @returns {boolean}
   * @public
   */
  hasListeners() {
    assert && assert( arguments.length === 0, 'Property.hasListeners should be called without arguments' );
    return this.changedEmitter.hasListeners();
  }

  /**
   * Registers a listener with multiple properties, then notifies the listener immediately.
   * @param {Property[]} properties
   * @param {function} listener function that takes values from the properties and returns nothing
   * @returns {Multilink}
   * @static
   */
  static multilink( properties, listener ) {
    return new Multilink( properties, listener, false );
  }

  /**
   * Registers an listener with multiple properties *without* an immediate callback with current values.
   * @param {Property[]} properties
   * @param {function} listener function that takes values from the properties and returns nothing
   * @returns {Multilink}
   * @static
   */
  static lazyMultilink( properties, listener ) {
    return new Multilink( properties, listener, true );
  }

  /**
   * Unlinks an listener that was added with multilink or lazyMultilink.
   * @param {Multilink} multilink
   * @static
   */
  static unmultilink( multilink ) {
    multilink.dispose();
  }

  /**
   * Register that one Property must have a "Phase" applied for PhET-iO state before another Property's Phase. A Phase
   * is an ending state in PhET-iO state set where Property values solidify, notifications for value changes are called.
   * The PhET-iO state engine will always undefer a Property before it notifies its listeners. This is for registering
   * two different Properties.
   * @public
   *
   * @param {Property} beforeProperty - the object that must be set before the second
   * @param {Property.Phase} beforePhase
   * @param {Property} afterProperty
   * @param {Property.Phase} afterPhase
   */
  static registerOrderDependency( beforeProperty, beforePhase, afterProperty, afterPhase ) {
    assert && assert( Property.Phase.includes( beforePhase ) && Property.Phase.includes( afterPhase ), 'unexpected phase' );

    if ( Tandem.PHET_IO_ENABLED && beforeProperty.isPhetioInstrumented() && afterProperty.isPhetioInstrumented() ) {
      phet.phetio.phetioEngine.phetioStateEngine.registerPropertyOrderDependency( beforeProperty, beforePhase, afterProperty, afterPhase );
    }
  }
}

// static attributes
Property.CHANGED_EVENT_NAME = 'changed';

/**
 * @public
 * @type {Enumeration}
 *
 * Describes the phases that a Property can go through in its value setting and notification lifecycle.
 *
 * UNDEFER - the phase when `Property.setDeferred(false)` is called and Property.value becomes accurate
 * NOTIFY - the phase when notifications are fired for Properties that have had a value change since becoming deferred
 */
Property.Phase = Enumeration.byKeys( [ 'UNDEFER', 'NOTIFY' ] );

axon.register( 'Property', Property );
export default Property;