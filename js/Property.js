// Copyright 2013-2017, University of Colorado Boulder

/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var Emitter = require( 'AXON/Emitter' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Multilink = require( 'AXON/Multilink' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var Tandem = require( 'TANDEM/Tandem' );

  /**
   * @param {*} value - the initial value of the property
   * @param {Object} [options] - options
   * @constructor
   */
  function Property( value, options ) {

    options = _.extend( {
      tandem: Tandem.tandemOptional(),
      phetioType: null, // must be specified by the client, like TProperty(TString)

      // {*[]|null} valid values for this Property. Mutually exclusive with options.isValidValue
      validValues: null,

      // {function|null} single parameter is a value to validate, returns true if valid, false if invalid
      // If null and validValues is provided, a value is valid if it is a member of validValues.
      // If null and no validValues are provided, all values are considered valid.
      isValidValue: null,

      // useDeepEquality: true => Use the `equals` method on the values
      // useDeepEquality: false => Use === for equality test
      useDeepEquality: false
    }, options );

    // value validation
    assert && assert( !(options.validValues && options.isValidValue), 'validValues and isValidValue are mutually exclusive' );

    // @private (read-only) whether to use the values' equals method or === equality
    // useDeepEquality: true => Use the `equals` method on the values
    // useDeepEquality: false => Use === for equality test
    this.useDeepEquality = options.useDeepEquality;

    this.isValidValue = options.isValidValue; // @private
    if ( !this.isValidValue && options.validValues ) {

      // validation is based on the set of validValues
      this.isValidValue = function( value ) {
        return options.validValues.indexOf( value ) !== -1;
      };
    }
    assert && this.isValidValue && assert( this.isValidValue( value ), 'invalid initial value: ' + value );

    // When running as phet-io, if the tandem is specified, the type must be specified.
    // This assertion helps in instrumenting code that has the tandem but not type
    Tandem.validationEnabled() && options.tandem.isLegalAndUsable() && assert && assert( !!options.phetioType,
      'Value type passed to Property must be specified. Tandem.id: ' + options.tandem.id );

    // When running as phet-io, if the tandem is specified, the type must be specified.
    // This assertion helps in instrumenting code that has the tandem but not type
    Tandem.validationEnabled() && options.tandem.isLegalAndUsable() && assert && assert( !!options.phetioType.elementType,
      'phetioType.elementType must be specified. Tandem.id: ' + options.tandem.id );

    // @private - Store the internal value and the initial value
    this._value = value;

    // @private - Initial value
    this._initialValue = value;

    // @private
    this.propertyTandem = options.tandem;

    // @public (phet-io)
    this.validValues = options.validValues;

    // @private (unit-tests) - emit1 is called when the value changes (or on link)
    // Also used in ShapePlacementBoard.js at the moment
    this.changedEmitter = new Emitter();

    // @public (read-only, scenery) {boolean} indicate whether the Property has been disposed
    this.isDisposed = false;

    // Register with tandem. TVoid is needed when not running in phet-io mode, because the phetioValueType is often
    // unsupplied. This causes downstream errors in TProperty.
    // @private
    this.phetioType = options.phetioType;
    options.tandem.addInstance( this, options );
  }

  axon.register( 'Property', Property );

  return inherit( Object, Property, {

      /**
       * Gets the value.  You can also use the es5 getter (property.value) but this means is provided for inner loops or internal code that must be fast.
       * @returns {*}
       * @public
       */
      get: function() {
        return this._value;
      },

      /**
       * Sets the value and notifies listeners.  You can also use the es5 getter (property.value) but this means is provided for inner loops or internal code that must be fast.
       * If the value hasn't changed, this is a no-op.
       *
       * @param {*} value
       * @public
       */
      set: function( value ) {
        assert && this.isValidValue && assert( this.isValidValue( value ), 'invalid value: ' + value );
        if ( !this.equalsValue( value ) ) {
          this._setAndNotifyListeners( value );
        }
        return this;
      },

      /**
       * Returns true if and only if the specified value equals the value of this property
       * @param {Object} value
       * @returns {boolean}
       * @private
       */
      equalsValue: function( value ) {
        return this.areValuesEqual( value, this._value );
      },

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
      areValuesEqual: function( a, b ) {
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
      },

      // @public
      get initialValue() {
        return this._initialValue;
      },

      // @private
      _setAndNotifyListeners: function( value ) {
        var oldValue = this.get();
        this._value = value;
        this._notifyListeners( oldValue );
      },

      // @private
      _notifyListeners: function( oldValue ) {

        var id = this.propertyTandem.isLegalAndUsable() && phetioEvents.start( 'model', this.propertyTandem.id, this.phetioType, 'changed', {
          oldValue: this.phetioType.elementType.toStateObject( oldValue ),
          newValue: this.phetioType.elementType.toStateObject( this.get() ),
          units: this.phetioType && this.phetioType.units
        } );

        this.changedEmitter.emit2( this.get(), oldValue );

        this.propertyTandem.isLegalAndUsable() && phetioEvents.end( id );
      },

      /**
       * Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
       * This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
       * This method is unsafe for removing listeners because it assumes the listener list not modified, to save another allocation
       * Only provides the new reference as a callback (no oldvalue)
       * See https://github.com/phetsims/axon/issues/6
       * @public
       */
      notifyListenersStatic: function() {
        this.changedEmitter.emit1( this.get() );
      },

      /**
       * Resets the value to the initial value.
       * @public
       */
      reset: function() {
        this.set( this._initialValue );
      },

      // @public
      get value() { return this.get(); },

      // @public
      set value( newValue ) { this.set( newValue ); },

      /**
       * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
       * notification provides the current value for newValue and null for oldValue.
       *
       * @param {function} listener a function of the form listener(newValue,oldValue)
       * @public
       */
      link: function( listener ) {
        this.changedEmitter.addListener( listener );
        listener( this.get(), null ); // null should be used when an object is expected but unavailable
      },

      /**
       * Add an listener to the Property, without calling it back right away.
       * This is used when you need to register a listener without an immediate callback.
       *
       * @param {function} listener - a function with a single argument, which is the value of the property at the time the function is called.
       * @public
       */
      lazyLink: function( listener ) {
        this.changedEmitter.addListener( listener );
      },

      /**
       * Removes a listener. If listener is not registered, this is a no-op.
       *
       * @param {function} listener
       * @public
       */
      unlink: function( listener ) {
        this.changedEmitter.removeListener( listener );
      },

      /**
       * Removes all listeners. If no listeners are registered, this is a no-op.
       */
      unlinkAll: function() {
        this.changedEmitter.removeAllListeners();
      },

      /**
       * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
       * Example: modelVisibleProperty.linkAttribute(view,'visible');
       *
       * @param object
       * @param attributeName
       * @public
       */
      linkAttribute: function( object, attributeName ) {
        var handle = function( value ) {object[ attributeName ] = value;};
        this.link( handle );
        return handle;
      },

      /**
       * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
       * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
       *
       * @param {function} listener
       * @public
       */
      unlinkAttribute: function( listener ) {
        this.unlink( listener );
      },

      // @public Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
      toString: function() {return 'Property{' + this.get() + '}'; },

      // @public
      valueOf: function() {return this.toString();},

      /**
       * Convenience function for debugging a property values.  It prints the new value on registration and when changed.
       * @param name debug name to be printed on the console
       * @returns {function} the handle to the linked listener in case it needs to be removed later
       * @public
       */
      debug: function( name ) {
        var listener = function( value ) { console.log( name, value ); };
        this.link( listener );
        return listener;
      },

      /**
       * Modifies the value of this Property with the ! operator.  Works for booleans and non-booleans.
       * @public
       */
      toggle: function() {
        this.value = !this.value;
      },

      // @public Ensures that the Property is eligible for GC
      dispose: function() {

        assert && assert( !this.isDisposed, 'cannot be disposed twice' );
        this.isDisposed = true;

        // remove any listeners that are still attached to this property
        this.unlinkAll();

        // remove tandem instance
        this.propertyTandem.removeInstance( this );
      },

      /**
       * Checks whether a listener is registered with this Property
       * @param {function} listener
       * @returns {boolean}
       * @public
       */
      hasListener: function( listener ) {
        return this.changedEmitter.hasListener( listener );
      },

      /**
       * Returns true if there are any listeners.
       * @returns {boolean}
       * @public
       */
      hasListeners: function() {
        assert && assert( arguments.length === 0, 'Property.hasListeners should be called without arguments' );
        return this.changedEmitter.hasListeners();
      },

      getDeclarator: function( options ) {

        var self = this;
        return {

          // Getter proxies to Model#get()...
          get: function() {
            return self.get();
          },

          // Setter proxies to Model#set(attributes)
          set: function( value ) { self.set( value ); },

          // Make it configurable and enumerable so it's easy to override...
          configurable: true,
          enumerable: true
        };
      }
    },

    //statics
    {
      /**
       * Registers a listener with multiple properties, then notifies the listener immediately.
       * @param {Property[]} properties
       * @param {function} listener function that takes values from the properties and returns nothing
       * @returns {Multilink}
       * @static
       */
      multilink: function( properties, listener ) {
        return new Multilink( properties, listener, false );
      },

      /**
       * Registers an listener with multiple properties *without* an immediate callback with current values.
       * @param {Property[]} properties
       * @param {function} listener function that takes values from the properties and returns nothing
       * @returns {Multilink}
       * @static
       */
      lazyMultilink: function( properties, listener ) {
        return new Multilink( properties, listener, true );
      },

      /**
       * Unlinks an listener that was added with multilink or lazyMultilink.
       * @param {Multilink} multilink
       * @static
       */
      unmultilink: function( multilink ) {
        multilink.dispose();
      }
    } );
} );
