// Copyright 2002-2013, University of Colorado Boulder

/**
 * An observable property, notifies registered observers when the value changes.
 *
 * Uses the "Constructor" pattern for object creation, which has the downside that
 * all properties are created once for each instance. It would be nice if our functions
 * were shared. But since the only way to create private fields is in the constructor,
 * and the functions need access to those private fields, there doesn't seem to be
 * any choice but to define the functions in the constructor.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  "use strict";

  var log = require( 'AXON/log' );
  var axon = require( 'AXON/axon' );

  /**
   * @param {*} value
   * @constructor
   */
  axon.Property = function Property( value ) {

    //Store the internal value and the initial value
    this._value = value;
    this._initialValue = value;
    this._observers = [];

    //Set up for recording
    log.registerProperty( this );
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
      if ( value !== this._value ) { //TODO: some Properties probably need deep comparisons here
        var oldValue = this._value;
        this._value = value;
        var observersCopy = this._observers.slice(); // make a copy, in case notification results in removeObserver
        for ( var i = 0; i < observersCopy.length; i++ ) {
          observersCopy[i]( value, oldValue );
        }
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
     * @param {Function} observer a function of the form observer(newValue,oldValue)
     */
    link: function( observer ) {
      if ( this._observers.indexOf( observer ) === -1 ) {
        this._observers.push( observer );
        observer( this._value, null ); // null should be used when an object is expected but unavailable
      }
    },

    /**
     * Removes an observer.
     * If observer is not registered, this is a no-op.
     *
     * @param {Function} observer
     */
    unlink: function( observer ) {
      var index = this._observers.indexOf( observer );
      if ( index !== -1 ) {
        this._observers.splice( index, index + 1 );
      }
    },

    /**
     * Add an observer to the Property, without calling it back right away.  This is mostly used for internal code.
     * @param {Function} observer  a function with a single argument, which is the value of the property at the time the function is called.
     */
    lazyLink: function( observer ) {
      if ( this._observers.indexOf( observer ) === -1 ) {
        this._observers.push( observer );
      }
    },

    //Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
    toString: function() {return 'Property{' + this.get() + '}'; },
    valueOf: function() {return this.toString();},

    /**
     * Add a listener so that it will only fire once (and not on registration)
     *
     * I can see two ways to implement this:
     * (a) add a field to the observer so after notifications it can be checked and possibly removed. Disadvantage: will make everything slower even if not using 'once'
     * (b) wrap the observer in a new function which will call the observer and then remove itself.  Disadvantage: cannot remove an observer added using 'once'
     * To avoid possible performance problems, use a wrapper function, and return it as a handle in case the 'once' listener must be removed before it is called once
     *
     * @param observer the listener which should be called back only for one property change (and not on registration)
     * @returns {Function} the wrapper handle in case the wrapped function needs to be removed with 'unlink' before it is called once
     */
    once: function( observer ) {
      var property = this;
      var wrapper = function( newValue, oldValue ) {
        observer( newValue, oldValue );
        property.unlink( wrapper );
      };
      this.lazyLink( wrapper );
      return wrapper;
    },

    /**
     * Links an object's named attribute to this property.  Returns a handle so it can be removed.
     * Example: modelVisibleProperty.linkAttribute(view,'visible');
     *
     * @param object
     * @param attributeName
     */
    linkAttribute: function( object, attributeName ) {
      var handle = function( value ) {object[attributeName] = value;};
      this.link( handle );
      return handle;
    },

    /**
     * Returns a new DerivedProperty which is true/false based on whether the value matches (based on ===) the passed in argument.
     * @param value
     * @returns {axon.DerivedProperty}
     */
    valueEquals: function( value ) {
      return new axon.DerivedProperty( [this], function( propertyValue ) { return propertyValue === value; } );
    },

    /**
     * Two way communication for not, so you can set the value and have it come back to the parent
     * Note that noting about the following code is specific to booleans, although this should probably be used mostly for booleans.
     * To unlink both listeners attached unlink a property created with not(), use detach()
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
     * @returns {Function} the handle to the linked listener in case it needs to be removed later
     */
    debug: function( name ) {
      var listener = function( value ) { console.log( name, value ); };
      this.link( listener );
      return listener;
    }
  };

  return axon.Property;
} );