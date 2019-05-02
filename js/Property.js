// Copyright 2013-2019, University of Colorado Boulder

/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const Multilink = require( 'AXON/Multilink' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const TinyEmitter = require( 'AXON/TinyEmitter' );
  const units = require( 'AXON/units' );
  const validate = require( 'AXON/validate' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );

  // variables
  let globalId = 0; // autoincremented for unique IDs

  class Property extends PhetioObject {

    /**
     * @param {*} value - the initial value of the property
     * @param {Object} [options] - options
     */
    constructor( value, options ) {
      options = _.extend( {

        tandem: Tandem.optional, // workaround for https://github.com/phetsims/tandem/issues/50

        // useDeepEquality: true => Use the `equals` method on the values
        // useDeepEquality: false => Use === for equality test
        useDeepEquality: false,

        // {string|null} units for the number, see units.js
        units: null,

        // {boolean} Whether reentrant calls to 'set' are allowed.
        // Use this to detect or prevent update cycles. Update cycles may be due to floating point error,
        // faulty logic, etc. This may be of particular interest for PhET-iO instrumentation, where such
        // cycles may pollute the data stream. See https://github.com/phetsims/axon/issues/179
        reentrant: false,

        // By default, check the options once in the constructor, not on each subsequent value validation, to improve
        // performance in requirejs mode
        validateOptionsOnValidateValue: false

        // Property also supports validator options, see ValidatorDef.VALIDATOR_KEYS.

      }, options );

      // Support non-validated Property
      if ( !ValidatorDef.containsValidatorKey( options ) ) {
        options.isValidValue = () => true;
      }
      assert && ValidatorDef.validateValidator( options );

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

      // @private {function|false} - closure over options for validation in set()
      this.validate = assert && ( value => validate( value, options ) );

      // validate the initial value
      assert && this.validate( value );

      // When running as phet-io, if the tandem is specified, the type must be specified.
      // This assertion helps in instrumenting code that has the tandem but not type
      Tandem.validationEnabled() && this.isPhetioInstrumented() && assert && assert( !!options.phetioType,
        'phetioType passed to Property must be specified. Tandem.phetioID: ' + this.tandem.phetioID );

      // When running as phet-io, if the tandem is specified, the type must be specified.
      // This assertion helps in instrumenting code that has the tandem but not type
      Tandem.validationEnabled() && this.isPhetioInstrumented() && assert && assert( !!options.phetioType.elementType,
        'phetioType.elementType must be specified. Tandem.phetioID: ' + this.tandem.phetioID );

      // @private - Store the internal value and the initial value
      this._value = value;

      // @protected - Initial value
      this._initialValue = value;

      // @public (phet-io)
      this.validValues = options.validValues;

      // @private (unit-tests) - emit1 is called when the value changes (or on link)
      // Also used in ShapePlacementBoard.js at the moment
      // We are validating here in Property, so we don't need the sub-emitter to validate too.
      this.changedEmitter = new TinyEmitter( );

      // @private whether we are in the process of notifying listeners
      this.notifying = false;

      // @private whether to allow reentry of calls to set
      this.reentrant = options.reentrant;

      // @private - while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
      // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
      // send notifications.
      this.isDeferred = false;

      // @private {*} - the value that this Property will take after no longer deferred
      this.deferredValue = null;

      // @private {boolean} whether a deferred value has been set
      this.hasDeferredValue = false;
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
     * Sets the value and notifies listeners, unless deferred. You can also use the es5 getter (property.value) but
     * this means is provided for inner loops or internal code that must be fast. If the value hasn't changed, this is
     * a no-op.
     *
     * @param {*} value
     * @returns {Property} this instance, for chaining.
     * @public
     */
    set( value ) {
      this.validate && this.validate( value );
      if ( this.isDeferred ) {
        this.deferredValue = value;
        this.hasDeferredValue = true;
      }
      else if ( !this.equalsValue( value ) ) {
        const oldValue = this.get();
        this.setPropertyValue( value );
        this._notifyListeners( oldValue );
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
     * @private
     */
    _notifyListeners( oldValue ) {

      this.phetioStartEvent( 'changed', () => {
        return {
          oldValue: this.phetioType.elementType.toStateObject( oldValue ),
          newValue: this.phetioType.elementType.toStateObject( this.get() )
        };
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
      this.changedEmitter.emit( this.get(), undefined, this );
    }

    /**
     * When deferred, set values do not take effect or send out notifications.  After defer ends, the Property takes
     * its deferred value (if any), and a follow-up action (return value) can be invoked to send out notifications
     * once other Properties have also taken their deferred values.
     *
     * @param {boolean} isDeferred - whether the Property should be deferred or not
     * @returns {function|null} - action that can be used to send notifications after final setDeferred(false),
     *                          - if the value changed
     * @public
     */
    setDeferred( isDeferred ) {
      assert && assert( isDeferred || !isDeferred, 'bad value for isDeferred' );
      if ( isDeferred ) {
        assert && assert( !this.isDeferred, 'Property already deferred' );
        this.isDeferred = true;
      }
      else if ( !isDeferred ) {
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
          return () => this._notifyListeners( oldValue );
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
     * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
     * notification provides the current value for newValue and null for oldValue.
     *
     * @param {function} listener a function of the form listener(newValue,oldValue)
     * @public
     */
    link( listener ) {
      this.changedEmitter.addListener( listener );
      listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
    }

    /**
     * Add an listener to the Property, without calling it back right away. This is used when you need to register a
     * listener without an immediate callback.
     * @param {function} listener - a function with a single argument, which is the current value of the Property.
     * @public
     */
    lazyLink( listener ) {
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

    // @public Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
    toString() {return 'Property#' + this.id + '{' + this.get() + '}'; }

    // @public
    valueOf() {return this.toString();}

    /**
     * Convenience function for debugging a property values.  It prints the new value on registration and when changed.
     * @param name debug name to be printed on the console
     * @returns {function} the handle to the linked listener in case it needs to be removed later
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
  }

  return axon.register( 'Property', Property );
} );