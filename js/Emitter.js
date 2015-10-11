//  Copyright 2002-2015, University of Colorado Boulder

/**
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var cleanArray = require( 'PHET_CORE/cleanArray' );

  /**
   *
   * @constructor
   */
  function Emitter() {
    this.listeners = [];

    // @private - keep track of whether listener are being processed in order to manage listener removal
    this.emitting = false;

    // @private - do not send callbacks to these listeners since they have been removed *during* emit
    this.removedListeners = [];

    // @private - in each 
    this.removedIndices = [];
  }

  return inherit( Object, Emitter, {
    addListener: function( listener ) {
      this.listeners.push( listener );
    },
    removeListener: function( listener ) {

      var index = this.listeners.indexOf( listener );
      assert && assert( index >= 0, 'tried to removeListener on something that wasnt a listener' );
      if ( index >= 0 ) {
        this.listeners.splice( index, 1 );
      }

      // If callbacks were being processed, mark this listener as `removed` so it won't receive a callback
      // NOTE: we must also either *batch* the removal of listeners for after emit
      // or change the index during the iteration.
      // The former is simpler, but would yield the odd case where containsListener() returns true
      // for something that has been removed (only during the current emit)
      // The latter case means we have to modify the iteration index while it is iterating, which sounds bug-prone
      // Likewise, what should happen if a listener is added while emit() is happening?
      // Seems like it should be called.
      // But our old process for dealing with this was to make a copy of the list--so items removed
      // or added to the list wouldn't be handled during that event?
      // Well, there is a precedent for it.
      if ( this.emitting ) {
        this.removedListeners.push( listener );
        this.removedIndices.push( index );
      }
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
      assert && assert( this.emitting === false, 're-entrant emit not allowed because it would interfere with removal of ' +
                                                 'listeners while processing emit' );
      this.emitting = true;
      for ( var i = 0; i < this.listeners.length; i++ ) {
        var listener = this.listeners[ i ];
        if ( this.removedListeners.length === 0 || this.removedListeners.indexOf( listener ) < 0 ) {
          listener();
        }
        if ( this.removedIndices.length >= 0 ) {
          for ( var j = 0; j < this.removedIndices.length; j++ ) {
            var removedIndex = this.removedIndices[ j ];
            if ( removedIndex <= i ) {
              i--;
            }
          }
          cleanArray( this.removedIndices );
        }
      }

      // Technically this if statement is not necessary, but it may be faster than a function call
      // so let's keep it for performance's sake.
      if ( this.removedListeners.length > 0 ) {
        cleanArray( this.removedListeners );
      }
      this.emitting = false;
    },
    emit1: function( arg1 ) {},
    emit2: function( arg2 ) {},
    containsListener: function( listener ) {
      return this.listeners.indexOf( listener ) >= 0;
    }
  } );
} );