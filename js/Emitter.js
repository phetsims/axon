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
    this.listenersToEmitTo = null;

    // @private - keep track of whether we have already made a defensive copy of listeners during a single emit call
    //            If we made a 2nd copy, it would be of the wrong listener list and hence wrong, so we must only do that
    //            once.
    this.alreadyCopiedDuringEmit = false;
  }

  axon.Emitter = Emitter;

  return inherit( Object, Emitter, {

    /**
     * @public add a listener
     * @param listener
     */
    addListener: function( listener ) {

      // If callbacks are in progress, make a copy of the current list of listeners--the newly added listener
      // will be available for the next emit() but not the one in progress.  This is to match behavior with removeListener
      this.defendCallbacks();

      this.listeners.push( listener );
    },

    /**
     * @public remove a listener
     * @param listener
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
     * @private - If processing callbacks during an emit() call and addListener/removeListener() is called,
     * make a defensive copy of the array of listener before changing the array, and use it for
     * the rest of the callbacks until the emit call has completed.
     */
    defendCallbacks: function() {
      if ( this.listenersToEmitTo !== null && !this.alreadyCopiedDuringEmit ) {
        this.listenersToEmitTo = this.listeners.slice();
        this.alreadyCopiedDuringEmit = true;
      }
    },

    /**
     * Remove all the listeners
     */
    removeAllListeners: function() {
      while ( this.listeners.length > 0 ) {
        this.removeListener( this.listeners[ 0 ] );
      }
    },

    /**
     * @public emit a single event.
     * This method is called many times in a simulation and must be well-optimized.
     */
    emit: function() {
      assert && assert( this.listenersToEmitTo === null, 're-entrant emit not allowed because it would interfere with removal of ' +
                                                         'listeners while processing emit' );
      this.listenersToEmitTo = this.listeners;
      for ( var i = 0; i < this.listenersToEmitTo.length; i++ ) {
        this.listenersToEmitTo[ i ]();
      }

      this.listenersToEmitTo = null;
      this.alreadyCopiedDuringEmit = false;
    },

    /**
     * emit a single event with one argument.  This is a copy-paste of emit() for performance reasons.
     * @param arg1
     */
    emit1: function( arg1 ) {
      assert && assert( this.listenersToEmitTo === null, 're-entrant emit not allowed because it would interfere with removal of ' +
                                                         'listeners while processing emit' );
      this.listenersToEmitTo = this.listeners;
      for ( var i = 0; i < this.listenersToEmitTo.length; i++ ) {
        this.listenersToEmitTo[ i ]( arg1 );
      }

      this.listenersToEmitTo = null;
      this.alreadyCopiedDuringEmit = false;
    },
    
    /**
     * emit a single event with two arguments.  This is a copy-paste of emit() for performance reasons.
     * @param arg1
     * @param arg2
     */
    emit2: function( arg1, arg2 ) {
      assert && assert( this.listenersToEmitTo === null, 're-entrant emit not allowed because it would interfere with removal of ' +
                                                         'listeners while processing emit' );
      this.listenersToEmitTo = this.listeners;
      for ( var i = 0; i < this.listenersToEmitTo.length; i++ ) {
        this.listenersToEmitTo[ i ]( arg1, arg2 );
      }

      this.listenersToEmitTo = null;
      this.alreadyCopiedDuringEmit = false;
    },

    /**
     * @public - check whether the listener is registered with this Emitter
     * @param listener
     * @returns {boolean}
     */
    containsListener: function( listener ) {
      return this.listeners.indexOf( listener ) >= 0;
    }
  } );
} );