// Copyright 2019, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  class TinyEmitter {
    constructor() {

      // @private {function[]} - the listeners that will be called on emit
      this.listeners = [];

      // @private {function[][]} - during emit() keep track of which listeners should receive events in order to manage
      //                         - removal of listeners during emit()
      this.activeListenersStack = [];

      // for production memory concerns; no need to keep this around.
      if ( assert ) {

        // @private {boolean} - to keep track if it has been disposed or not
        this.isDisposed = false;
      }
    }

    /**
     * Disposes an Emitter. All listeners are removed.
     * @public
     */
    dispose() {
      this.listeners.length = 0; // See https://github.com/phetsims/axon/issues/124

      if ( assert ) {
        this.isDisposed = true;
      }
    }

    /**
     * Notify listeners
     * @public
     */
    emit() {

      // Notify wired-up listeners, if any
      if ( this.listeners.length > 0 ) {
        this.activeListenersStack.push( this.listeners );

        // Notify listeners--note the activeListenersStack could change as listeners are called, so we do this by index
        const lastEntry = this.activeListenersStack.length - 1;
        for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
          this.activeListenersStack[ lastEntry ][ i ].apply( null, arguments );
        }

        this.activeListenersStack.pop();
      }
    }

    /**
     * Adds a listener which will be called during emit.
     * @param {function} listener
     * @public
     */
    addListener( listener ) {

      assert && assert( this.listeners.indexOf( listener ) === -1, 'Cannot add the same listener twice' );

      // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
      // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
      // removeListener.
      this.defendListeners();

      this.listeners.push( listener );
    }

    /**
     * Removes a listener
     * @param {function} listener
     * @public
     */
    removeListener( listener ) {

      const index = this.listeners.indexOf( listener );

      // Throw an error when removing a non-listener (except when the Emitter has already been disposed, see
      // https://github.com/phetsims/sun/issues/394#issuecomment-419998231
      if ( assert && !this.isDisposed ) {
        assert( index !== -1, 'tried to removeListener on something that wasn\'t a listener' );
      }

      // If an emit is in progress, make a copy of the current list of listeners--the removed listener will remain in
      // the list and be called for this emit call, see #72
      this.defendListeners();

      this.listeners.splice( index, 1 );
    }

    /**
     * Removes all the listeners
     * @public
     */
    removeAllListeners() {
      while ( this.listeners.length > 0 ) {
        this.removeListener( this.listeners[ 0 ] );
      }
    }

    /**
     * If addListener/removeListener is called while emit() is in progress, we must make a defensive copy of the array
     * of listeners before changing the array, and use it for the rest of the notifications until the emit call has
     * completed.
     * @private
     */
    defendListeners() {

      for ( let i = this.activeListenersStack.length - 1; i >= 0; i-- ) {

        // Once we meet a level that was already defended, we can stop, since all previous levels are also defended
        if ( this.activeListenersStack[ i ].defended ) {
          break;
        }
        else {
          const defendedListeners = this.listeners.slice();

          // Mark copies as 'defended' so that it will use the original listeners when emit started and not the modified
          // list.
          defendedListeners.defended = true;
          this.activeListenersStack[ i ] = defendedListeners;
        }
      }
    }

    /**
     * Checks whether a listener is registered with this Emitter
     * @param {function} listener
     * @returns {boolean}
     * @public
     */
    hasListener( listener ) {
      assert && assert( arguments.length === 1, 'Emitter.hasListener should be called with 1 argument' );
      return this.listeners.indexOf( listener ) >= 0;
    }

    /**
     * Returns true if there are any listeners.
     * @returns {boolean}
     * @public
     */
    hasListeners() {
      assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
      return this.listeners.length > 0;
    }

    /**
     * Returns the number of listeners.
     * @returns {number}
     * @public
     */
    getListenerCount() {
      return this.listeners.length;
    }
  }

  return axon.register( 'TinyEmitter', TinyEmitter );
} );