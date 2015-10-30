// Copyright 2002-2015, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var axon = require( 'AXON/axon' );

  /**
   *
   * @constructor
   */
  function Emitter() {
    this.listeners = [];

    // @private - during emit() keep track of which listeners should receive events
    //            in order to manage removal of listeners during emit() 
    this.listenersToEmitTo = [];
  }

  axon.Emitter = Emitter;

  return inherit( Object, Emitter, {

    /**
     * Add a listener
     * @param {function} listener
     * @public
     */
    addListener: function( listener ) {

      // If callbacks are in progress, make a copy of the current list of listeners--the newly added listener
      // will be available for the next emit() but not the one in progress.  This is to match behavior with removeListener
      this.defendCallbacks();

      this.listeners.push( listener );
    },

    /**
     * Remove a listener
     * @param {function} listener
     * @public
     */
    removeListener: function( listener ) {

      var index = this.listeners.indexOf( listener );
      assert && assert( index >= 0, 'tried to removeListener on something that wasnt a listener' );

      // If callbacks are in progress, make a copy of the current list of listeners--the removed listener 
      // will remain in the list and receive a callback for this emit call, see #72
      this.defendCallbacks();

      this.listeners.splice( index, 1 );
    },

    /**
     * If processing callbacks during an emit() call and addListener/removeListener() is called,
     * make a defensive copy of the array of listener before changing the array, and use it for
     * the rest of the callbacks until the emit call has completed.
     * @private
     */
    defendCallbacks: function() {

      if ( this.listenersToEmitTo.length > 0 && !this.listenersToEmitTo[ this.listenersToEmitTo.length - 1 ].defended ) {
        var defendedListeners = this.listeners.slice();

        // Mark copies as 'defended' so that it will use the original listeners when emit started and not the modified list.
        defendedListeners.defended = true;
        this.listenersToEmitTo[ this.listenersToEmitTo.length - 1 ] = defendedListeners;
      }
    },

    /**
     * Remove all the listeners
     * @public
     */
    removeAllListeners: function() {
      while ( this.listeners.length > 0 ) {
        this.removeListener( this.listeners[ 0 ] );
      }
    },

    /**
     * Emit a single event.
     * This method is called many times in a simulation and must be well-optimized.
     * @public
     */
    emit: function() {
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]();
      }

      this.listenersToEmitTo.pop();
    },

    /**
     * Emit a single event with one argument.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg1
     * @public
     */
    emit1: function( arg1 ) {
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]( arg1 );
      }

      this.listenersToEmitTo.pop();
    },

    /**
     * Emit a single event with two arguments.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg1
     * @param {*} arg2
     * @public
     */
    emit2: function( arg1, arg2 ) {
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]( arg1, arg2 );
      }

      this.listenersToEmitTo.pop();
    },

    /**
     * Check whether the listener is registered with this Emitter
     * @param {function} listener
     * @returns {boolean}
     * @public
     */
    containsListener: function( listener ) {
      return this.listeners.indexOf( listener ) >= 0;
    },

    /**
     * Returns true if there are any listeners.
     * @returns {boolean}
     * @public
     */
    hasListeners: function() {
      return this.listeners.length > 0;
    }
  } );
} );