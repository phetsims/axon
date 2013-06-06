// Copyright 2002-2012, University of Colorado

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

  var log = require( 'PHETCOMMON/model/property/log' );

  /**
   * @param {*} value
   * @constructor
   */
  function Property( value ) {

    // Variables declared in the constructor are private.
    var _value = value;
    var _initialValue = value;
    this._observers = [];

    /**
     * Gets the value.
     * @return {*}
     */
    this.get = function() {
      return _value;
    };

    /**
     * Sets the value and notifies registered observers.
     * If the value hasn't changed, this is a no-op.
     *
     * @param {*} value
     */
    this.set = function( value ) {
      if ( value !== _value ) {
        var oldValue = _value;
        _value = value;
        var observersCopy = this._observers.slice(); // make a copy, in case notification results in removeObserver
        for ( var i = 0; i < observersCopy.length; i++ ) {
          observersCopy[i]( value, oldValue );
        }
      }
    };

    /**
     * Resets the value to the initial value.
     */
    this.reset = function() {
      this.set( _initialValue );
    };

    /**
     * Adds an observer and notifies it immediately.
     * If observer is already registered, this is a no-op.
     * The initial notification provides the current value for newValue and null for oldValue.
     *
     * @param {Function} observer a function of the form observer(newValue,oldValue)
     * @deprecated will be removed when everyone is using link //TODO: Delete when all usages are gone
     */
    this.addObserver = function( observer ) {
      if ( this._observers.indexOf( observer ) === -1 ) {
        this._observers.push( observer );
        observer( _value, null ); // null should be used when an object is expected but unavailable
      }
    };

    /**
     * Removes an observer.
     * If observer is not registered, this is a no-op.
     *
     * @param {Function} observer
     * @deprecated will be removed when everyone is using link //TODO: Delete when all usages are gone
     */
    this.removeObserver = function( observer ) {
      var index = this._observers.indexOf( observer );
      if ( index !== -1 ) {
        this._observers.splice( index, index + 1 );
      }
    };

    /**
     * This function returns a bound function that sets the specified value.  For use in creating closures e.g. with gui classes.
     * For instance, to have a button that sets a property to true, instead of using
     * button.click(function(){property.set(true);});
     * you could use
     * button.click(property._set(true));
     * @param value the value to use when the setter is called.
     * @return a function that can be used to set the specified value.
     */
    this._set = function( value ) {
      return this.set.bind( this, value );
    };

    log.registerProperty( this );
  }

  //Adapters to conform to the Fort.property interface
  Property.prototype = {

    get value() { return this.get(); },

    set value( newValue ) { this.set( newValue ); },

    link: function( observer ) { this.addObserver( observer ); },

    unlink: function( observer ) { this.removeObserver( observer ); },

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
    valueOf: function() {return this.toString();}
  };

  return Property;
} );