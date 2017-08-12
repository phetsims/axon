// Copyright 2013-2016, University of Colorado Boulder

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
  var inherit = require( 'PHET_CORE/inherit' );
  var Emitter = require( 'AXON/Emitter' );
  var Multilink = require( 'AXON/Multilink' );
  var Tandem = require( 'TANDEM/Tandem' );
  var TProperty = require( 'AXON/TProperty' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );

  /**
   * @param {*} value - the initial value of the property
   * @param {Object} [options] - options
   * @constructor
   */
  function Property( value, options ) {

    var self = this;

    // Check duck type for incorrect Tandem argument
    if ( options && options.isTandem ) {
      assert && assert( false, 'Options should be an Object, not a Tandem' );
    }

    options = _.extend( {
      tandem: Tandem.tandemOptional(),
      phetioValueType: null, // {function | null} phet-io type wrapper like TString, TNumber, etc.

      // {*[]|null} valid values for this Property. Mutually exclusive with options.isValidValue
      validValues: null,

      // {function|null} single parameter is a value to validate, returns true if valid, false if invalid
      // If null and validValues is provided, a value is valid if it is a member of validValues.
      // If null and no validValues are provided, all values are considered valid.
      isValidValue: null,

      // A place to add annotation or notes for a property
      phetioInstanceDocumentation: '',

      // Properties can opt-out of appearing in the phetio.getState() and phetio.setState() where the values are redundant or easily recomputed
      // in the playback simulation.
      phetioStateElement: true,

      // useDeepEquality: true => Use the `equals` method on the values
      // useDeepEquality: false => Use === for equality test
      useDeepEquality: false
    }, options );

    // value validation
    assert && assert( !( options.validValues && options.isValidValue ), 'validValues and isValidValue are mutually exclusive' );

    // @public (read-only) whether to use the values' equals method or === equality
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

    // @public - export the phet-io element type
    this.phetioValueType = options.phetioValueType;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    // This assertion helps in instrumenting code that has the tandem but not type
    Tandem.validationEnabled() && options.tandem.isLegalAndUsable() && assert && assert( !!options.phetioValueType,
      'Type passed to Property must be specified. Tandem.id: ' + options.tandem.id );

    // @public (read-only) Emitters that indicate the start/end of processing callbacks for a change.  Also used for PhET-iO data stream
    this.startedCallbacksForChangedEmitter = new Emitter( { indicateCallbacks: false } );
    this.endedCallbacksForChangedEmitter = new Emitter( { indicateCallbacks: false } );

    // @private - Store the internal value and the initial value
    this._value = value;

    // @private - Initial value
    this._initialValue = value;

    // @private (unit-tests) - emit1 is called when the value changes (or on link)
    // Also used in ShapePlacementBoard.js at the moment
    this.changedEmitter = new Emitter();

    // Register with tandem. TVoid is needed when not running in phet-io mode, because the phetioValueType is often
    // unsupplied. This causes downstream errors in TProperty.
    options.tandem.addInstance( this, TProperty( options.phetioValueType || TVoid, {
      phetioInstanceDocumentation: options.phetioInstanceDocumentation,
      phetioStateElement: options.phetioStateElement
    } ) );

    // @private
    this.disposeProperty = function() {

      // remove any listeners that are still attached to this property
      self.changedEmitter.listeners.length = 0;

      // remove tandem instance
      options.tandem.removeInstance( self );
    };
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

        // Note the current value, since it will be sent to possibly multiple listeners.
        var value = this.get();

        this.startedCallbacksForChangedEmitter.emit2( value, oldValue );

        this.changedEmitter.emit2( value, oldValue );

        this.endedCallbacksForChangedEmitter.emit();
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
        if ( !this.changedEmitter.hasListener( listener ) ) {
          this.changedEmitter.addListener( listener );
          listener( this.get(), null ); // null should be used when an object is expected but unavailable
        }
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
        if ( this.changedEmitter.hasListener( listener ) ) {
          this.changedEmitter.removeListener( listener );
        }
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
       * Add a listener so that it will only fire once (and not on registration)
       *
       * I can see two ways to implement this:
       * (a) add a field to the listener so after notifications it can be checked and possibly removed. Disadvantage: will make everything slower even if not using 'once'
       * (b) wrap the listener in a new function which will call the listener and then remove itself.  Disadvantage: cannot remove an listener added using 'once'
       * To avoid possible performance problems, use a wrapper function, and return it as a handle in case the 'once' listener must be removed before it is called once
       *
       * @param {function} listener the listener which should be called back only for one property change (and not on registration)
       * @returns {function} the wrapper handle in case the wrapped function needs to be removed with 'unlink' before it is called once
       * @public
       */
      once: function( listener ) {
        var self = this;
        var wrapper = function( newValue, oldValue ) {
          self.unlink( wrapper );
          listener( newValue, oldValue );
        };
        this.lazyLink( wrapper );
        return wrapper;
      },

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

      /**
       * Adds a listener that is fired when the property takes the specified value.  If the property has the value already,
       * the listener is called back immediately.  A reference to the listener is returned so that it can be removed.
       *
       * @param {Object} value - the value to match
       * @param {function} listener - the listener that is called when this Property
       * @public
       */
      onValue: function( value, listener ) {
        assert && this.isValidValue && assert( this.isValidValue( value ), 'attempt to observe invalid value: ' + value );
        var self = this;
        var onValueListener = function( v ) {
          if ( self.areValuesEqual( v, value ) ) {
            listener();
          }
        };
        this.link( onValueListener );
        return onValueListener;
      },

      // @public Ensures that the Property is eligible for GC
      dispose: function() {
        this.disposeProperty();
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
      },

      /**
       * When porting simulations away from PropertySet, it is useful to have a way to guarantee that all ES5
       * getters and setters have been refactored.  This method can help you identify ES5 get/set calls that still exist
       * if they are triggered in the code at runtime.
       * @param {Object} object
       * @param {string} prop
       * @deprecated this is for debugging only - do not leave calls to this function in production code
       */
      preventGetSet: function( object, prop ) {
        Object.defineProperty( object, prop, {

          get: function() {
            assert && assert( false, 'getter prevented for prop: ' + prop );
          },

          set: function( value ) {
            assert && assert( false, 'setter prevented for prop: ' + prop );
          },

          // Make it configurable and enumerable so it's easy to override.
          configurable: true,
          enumerable: true
        } );
      }
    } );
} );
