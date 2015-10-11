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
    addListener: function( listener ) {
      this.listeners.push( listener );
    },
    removeListener: function( listener ) {

      var index = this.listeners.indexOf( listener );
      assert && assert( index >= 0, 'tried to removeListener on something that wasnt a listener' );

      // If processing callbacks during an emit() call and removeListener() is called,
      // make a defensive copy of the array of listener before removing anything, and use it for 
      // the rest of the callbacks.
      if ( this.listenersToEmitTo !== null && !this.alreadyCopiedDuringEmit ) {
        this.listenersToEmitTo = this.listeners.slice();
        this.alreadyCopiedDuringEmit = true;
      }

      this.listeners.splice( index, 1 );
    },
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
    containsListener: function( listener ) {
      return this.listeners.indexOf( listener ) >= 0;
    }
  } );
} );