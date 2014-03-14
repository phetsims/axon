// Copyright 2002-2013, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var axon = require( 'AXON/axon' );

  /**
   * @class Events
   * @constructor
   * @param values an object hash with the initial values for the properties
   */
  axon.Events = function Events() {
    this.eventListeners = {};
  };

  axon.Events.prototype = {

    /////////////////////////////////////////////
    // Below this point are the functions for event handling, basically orthogonal to property value change notifications

    /**
     * Register a listener when the specified eventName is triggered.
     * @param eventName {String} the name for the event channel
     * @param callback
     */
    on: function( eventName, callback ) {
      this.eventListeners[eventName] = this.eventListeners[eventName] || [];
      this.eventListeners[eventName].push( callback );
    },

    /**
     * Adds a function which will only be called back once, after which it is removed as a listener.
     * If you need to remove a function added with 'once' you will have to remove its handle, which is returned by the function.
     * @param eventName {String} the name for the event channel
     * @param callback function to be called back once (if at all)
     */
    once: function( eventName, callback ) {
      var events = this;
      var wrappedCallback = function() {
        events.off( eventName, wrappedCallback );

        //If no arguments being passed through, call back without processing arguments, for possible speed
        if ( arguments.length === 0 ) {
          callback();
        }
        else {

          //General case of passing events through to the wrapped callback function
          callback.apply( this, Array.prototype.slice.call( arguments, 0 ) );
        }
      };
      this.on( eventName, wrappedCallback );

      //Return the handle in case it needs to be removed.
      return wrappedCallback;
    },

    /**
     * Remove a listener from the specified event type.  Does nothing if the listener did not exist
     * @param eventName {String} the name for the event channel
     * @param callback
     */
    off: function( eventName, callback ) {
      if ( this.eventListeners[eventName] ) {
        var index = this.eventListeners[eventName].indexOf( callback );
        if ( index !== -1 ) {
          this.eventListeners[eventName].splice( index, 1 );
        }
      }
    },

    /**
     * Trigger an event with the specified name and arguments.
     * @param eventName {String} the name for the event channel
     * @param args... optional arguments to pass to the listeners
     */
    trigger: function( eventName ) {
      if ( this.eventListeners[eventName] ) {
        var listenersCopy = this.eventListeners[eventName].slice(); // make a copy, in case callback removes listener
        for ( var i = 0; i < listenersCopy.length; i++ ) {
          var listener = listenersCopy[i];

          //Simple case of no arguments, call it separately for improved performance in case it is faster (untested)
          if ( arguments.length === 1 ) {
            listener( arguments );
          }
          else {
            var suffix = Array.prototype.slice.call( arguments, 1 );
            listener.apply( this, suffix );
          }
        }
      }
    }
  };

  return axon.Events;
} );