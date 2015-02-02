// Copyright 2002-2013, University of Colorado Boulder

/**
 * An observable property, notifies registered observers when the value changes.
 *
 * Uses the 'Constructor' pattern for object creation, which has the downside that
 * all properties are created once for each instance. It would be nice if our functions
 * were shared. But since the only way to create private fields is in the constructor,
 * and the functions need access to those private fields, there doesn't seem to be
 * any choice but to define the functions in the constructor.
 *
 * @author Sam Reid
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  var axon = require( 'AXON/axon' );
  require( 'AXON/Multilink' );

  /**
   * @param {*} value
   * @constructor
   */
  axon.Property = function Property( value, options ) {

    //Store the internal value and the initial value
    this.storeValue( value );        // typically sets this._value
    this.storeInitialValue( value ); // typically sets this._initialValue
    this._observers = [];

    //Model component ID for data studies, regression testing, etc
    this.propertyID = options ? options.propertyID : null;

    //By default, events can be logged for data analysis studies, but setSendPhetEvents can be set to false for events that should not be recorded (such as the passage of time).
    this.sendPhetEvents = true;
    this.lastMessageTime = 0;//Start at the epoch, so the first message will be sent.
    this.delay = 0; //Seconds between messages (if throttled).  Zero means no throttling
  };

  axon.Property.prototype = {

    /**
     * Gets the value.  You can also use the es5 getter (property.value) but this means is provided for inner loops or internal code that must be fast.
     * @return {*}
     */
    get: function() {
      return this._value;
    },

    /**
     * Sets the value and notifies registered observers.  You can also use the es5 getter (property.value) but this means is provided for inner loops or internal code that must be fast.
     * If the value hasn't changed, this is a no-op.
     *
     * @param {*} value
     */
    set: function( value ) {
      if ( !this.equalsValue( value ) ) {
        this._setAndNotifyObservers( value );
      }
      return this;
    },

    // whether this property will not "change" when the passed-in value is set
    equalsValue: function( value ) {
      return value === this._value;
    },

    // store the current (new) value
    storeValue: function( value ) {
      this._value = value;
    },

    // store the initial value
    storeInitialValue: function( value ) {
      this._initialValue = value;
    },

    get initialValue() {
      return this._initialValue;
    },

    _setAndNotifyObservers: function( value ) {
      var oldValue = this.get();
      this.storeValue( value );
      this._notifyObservers( oldValue );
    },

    _notifyObservers: function( oldValue ) {

      // Note the current value, since it will be sent to possibly multiple observers.
      var value = this.get();

      // If enabled, send a message to phet events.  Avoid as much work as possible if phet.arch is inactive.
      var time = null;
      var sendMessage = null;
      if ( phet.arch.active ) {
        time = Date.now();

        //Only send a message if sendPhetEvents is on and the throttling permits it (i.e. it has been long enough since the last message).
        sendMessage = this.sendPhetEvents && (this.delay === 0 || (time - this.lastMessageTime > this.delay * 1000));

        // Deliver the change event message to phet.arch
        if ( sendMessage ) {
          assert && assert( this.propertyID !== null );
          phet.arch.start( 'model', this.propertyID, 'Property', 'changed', { value: value } );
        }
      }

      // TODO: JO: avoid slice() by storing observers array correctly
      var observersCopy = this._observers.slice(); // make a copy, in case notification results in removeObserver
      for ( var i = 0; i < observersCopy.length; i++ ) {
        observersCopy[ i ]( value, oldValue );
      }

      // Send the end message to phet.arch
      if ( sendMessage ) {
        phet.arch.end();
        this.lastMessageTime = time;
      }
    },

    //Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
    //This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
    //This method is unsafe for removing observers because it assumes the observer list not modified, to save another allocation
    //Only provides the new reference as a callback (no oldvalue)
    //See https://github.com/phetsims/axon/issues/6
    notifyObserversStatic: function() {
      var value = this.get();
      for ( var i = 0; i < this._observers.length; i++ ) {
        this._observers[ i ]( value );
      }
    },

    /**
     * Resets the value to the initial value.
     */
    reset: function() {
      this.set( this._initialValue );
    },

    /**
     * This function returns a bound function that sets the specified value.  For use in creating closures e.g. with gui classes.
     * For instance, to have a button that sets a property to true, instead of using
     * button.click(function(){property.set(true);});
     * you could use
     * button.click(property._set(true));
     * @param value the value to use when the setter is called.
     * @return a function that can be used to set the specified value.
     */
    _set: function( value ) {
      return this.set.bind( this, value );
    },

    get value() { return this.get(); },

    set value( newValue ) { this.set( newValue ); },

    /**
     * Adds an observer and notifies it immediately.
     * If observer is already registered, this is a no-op.
     * The initial notification provides the current value for newValue and null for oldValue.
     *
     * @param {function} observer a function of the form observer(newValue,oldValue)
     */
    link: function( observer ) {
      if ( this._observers.indexOf( observer ) === -1 ) {
        this._observers.push( observer );
        observer( this.get(), null ); // null should be used when an object is expected but unavailable
      }
    },

    /**
     * Add an observer to the Property, without calling it back right away.  This is used when you need to register a observer without an immediate callback.
     * @param {function} observer  a function with a single argument, which is the value of the property at the time the function is called.
     */
    lazyLink: function( observer ) {
      if ( this._observers.indexOf( observer ) === -1 ) {
        this._observers.push( observer );
      }
    },

    /**
     * Removes an observer.
     * If observer is not registered, this is a no-op.
     *
     * @param {function} observer
     */
    unlink: function( observer ) {
      var index = this._observers.indexOf( observer );
      if ( index !== -1 ) {
        this._observers.splice( index, 1 );
      }
    },

    /**
     * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
     * Example: modelVisibleProperty.linkAttribute(view,'visible');
     *
     * @param object
     * @param attributeName
     */
    linkAttribute: function( object, attributeName ) {
      var handle = function( value ) {object[ attributeName ] = value;};
      this.link( handle );
      return handle;
    },

    /**
     * Unlink an observer added with linkAttribute.  Note: the args of linkAttribute do not match the args of
     * unlinkAttribute: here, you must pass the observer handle returned by linkAttribute rather than object and attributeName
     * @param observer
     */
    unlinkAttribute: function( observer ) {
      this.unlink( observer );
    },

    //Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
    toString: function() {return 'Property{' + this.get() + '}'; },
    valueOf: function() {return this.toString();},

    /**
     * Add an observer so that it will only fire once (and not on registration)
     *
     * I can see two ways to implement this:
     * (a) add a field to the observer so after notifications it can be checked and possibly removed. Disadvantage: will make everything slower even if not using 'once'
     * (b) wrap the observer in a new function which will call the observer and then remove itself.  Disadvantage: cannot remove an observer added using 'once'
     * To avoid possible performance problems, use a wrapper function, and return it as a handle in case the 'once' observer must be removed before it is called once
     *
     * @param observer the observer which should be called back only for one property change (and not on registration)
     * @returns {function} the wrapper handle in case the wrapped function needs to be removed with 'unlink' before it is called once
     */
    once: function( observer ) {
      var property = this;
      var wrapper = function( newValue, oldValue ) {
        property.unlink( wrapper );
        observer( newValue, oldValue );
      };
      this.lazyLink( wrapper );
      return wrapper;
    },

    /**
     * Returns a new DerivedProperty which is true/false based on whether the value matches (based on ===) the passed in argument.
     * @param value
     * @returns {axon.DerivedProperty}
     */
    valueEquals: function( value ) {
      return new axon.DerivedProperty( [ this ], function( propertyValue ) { return propertyValue === value; } );
    },

    /**
     * Returns a new boolean DerivedProperty which is true/false based on && operator.
     * @param otherProperty
     * @returns {DerivedProperty.<boolean>}
     */
    and: function( otherProperty ) {
      return new axon.DerivedProperty( [ this, otherProperty ], function( thisValue, otherValue ) { return thisValue && otherValue; } );
    },

    /**
     * Returns a new boolean DerivedProperty which is true/false based on || operator.
     * @param otherProperty
     * @returns {DerivedProperty.<boolean>}
     */
    or: function( otherProperty ) {
      return new axon.DerivedProperty( [ this, otherProperty ], function( thisValue, otherValue ) { return thisValue || otherValue; } );
    },

    /**
     * Multiply this property's value by a constant scalar number, and return the derived property.
     *
     * @param scalar
     * @returns {axon.DerivedProperty}
     */
    times: function( scalar ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return thisValue * scalar; } );
    },

    /**
     * Multiply this property's value by a constant scalar number, and return the derived property.
     *
     * @param number
     * @returns {axon.DerivedProperty}
     */
    plus: function( number ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return thisValue + number; } );
    },

    /**
     * Return a derived property that is true if and only if this value is less than the specified number.
     *
     * @param number
     * @returns {axon.DerivedProperty}
     */
    lessThanNumber: function( number ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return thisValue < number; } );
    },

    /**
     * Return a derived property that is true if and only if this value is greater than the specified number.
     *
     * @param number
     * @returns {axon.DerivedProperty}
     */
    greaterThanNumber: function( number ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return thisValue > number; } );
    },

    /**
     * Not property, which does not propagate changes to dependents.
     * @returns {DerivedProperty}
     */
    derivedNot: function() {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return !thisValue; } );
    },

    /**
     * Two way communication for not, so you can set the value and have it come back to the parent
     * Note that noting about the following code is specific to booleans, although this should probably be used mostly for booleans.
     * To unlink both observers attached unlink a property created with not(), use detach()
     */
    not: function() {
      var parentProperty = this;
      var childProperty = new axon.Property( !this.value );

      var setParentToChild = function( value ) {childProperty.set( !value );};
      parentProperty.link( setParentToChild );

      var setChildToParent = function( value ) {parentProperty.set( !value );};
      childProperty.link( setChildToParent );

      childProperty.detach = function() {
        parentProperty.unlink( setParentToChild );
        childProperty.unlink( setChildToParent );
      };
      return childProperty;
    },

    /**
     * Convenience function for debugging a property values.  It prints the new value on registration and when changed.
     * @param name debug name to be printed on the console
     * @returns {function} the handle to the linked observer in case it needs to be removed later
     */
    debug: function( name ) {
      var observer = function( value ) { console.log( name, value ); };
      this.link( observer );
      return observer;
    },

    //Returns a new Property that maps its values using the specified lookup table.
    //If the parent property value does not appear as a key in the lookup table, the returned property value is undefined
    mapValues: function( values ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) { return values[ thisValue ];} );
    },

    //Returns a new Property that maps its values using the specified function
    //See https://github.com/phetsims/axon/issues/25
    map: function( f ) {
      return new axon.DerivedProperty( [ this ], function( thisValue ) {return f( thisValue );} );
    },

    /**
     * Returns a function that can be used to toggle the property (using !)
     * @returns {function}
     */
    get toggleFunction() {
      return this.toggle.bind( this );
    },

    /**
     * Modifies the value of this Property with the ! operator.  Works for booleans and non-booleans.
     */
    toggle: function() {
      this.value = !this.value;
    },

    /**
     * Adds an observer that is fired when the property takes the specified value.  If the property has the value already,
     * the observer is called back immediately.  A reference to the observer is returned so that it can be removed.
     *
     * @param value the value to match
     * @param observer the observer that is called when this Property
     */
    onValue: function( value, observer ) {
      var observer = function( v ) {
        if ( v === value ) {
          observer();
        }
      };
      this.link( observer );
      return observer;
    }
  };

  /**
   * Registers an observer with multiple properties, then notifies the observer immediately.
   * @param {Property[]} properties
   * @param {function} observer no params, returns nothing
   * @static
   */
  axon.Property.multilink = function( properties, observer ) {
    return new axon.Multilink( properties, observer, false );
  };

  axon.Property.lazyMultilink = function( properties, observer ) {
    return new axon.Multilink( properties, observer, true );
  };

  /**
   * Removes the multilinked observer from this Property.
   * Same as calling detach() on the handle (which happens to be a DerivedProperty instance)
   * @param derivedProperty
   */
  axon.Property.unmultilink = function( derivedProperty ) {
    derivedProperty.detach();
  };

  axon.Property.prototype.setSendPhetEvents = function( sendPhetEvents ) {
    this.sendPhetEvents = sendPhetEvents;
    return this;
  };

  axon.Property.prototype.throttle = function( delay ) {
    this.delay = delay;
    return this;
  };

  axon.Property.initArch = function() {
    //TODO: Is there a better place for this declaration?
    window.phet = window.phet || {};
    window.phet.arch = window.phet.arch || {

      //Flag that indicates the sim is not instrumented for a data-driven study.  Provides short-circuiting for lines like: phet.arch.active && (...)
      active: false,

      //Just return the callback directly.
      //'user', options.componentID, 'CheckBox', 'toggled',
      wrap: function( messageType, componentID, componentType, action, callback, options ) {
        return callback;
      },

      trigger: function() {},

      start: function() {},

      end: function() {}
    };
  };

  axon.Property.initArch();

  return axon.Property;
} );
