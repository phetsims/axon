// Copyright 2015-2021, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';

// constants
const shuffleListeners = _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.shuffleListeners;

class TinyEmitter {

  /**
   * @param {function()|null} [onBeforeNotify]
   */
  constructor( onBeforeNotify ) {

    if ( onBeforeNotify ) {

      assert && assert( typeof onBeforeNotify === 'function', 'onBeforeNotify should be a function' );

      // @private {function()} - if specified, this will be called before listeners are notified.
      this.onBeforeNotify = onBeforeNotify;
    }

    // @private {Set.<function>} - the listeners that will be called on emit
    this.listeners = new Set();

    // @private {Object[]} - during emit() keep track of iteration progress and guard listeners if mutated during emit()
    this.emitContexts = [];

    // @public {function|undefined} changeCount - Not defined usually because of memory usage. If defined, this will be
    // called when the listener count changes, e.g. changeCount( {number} listenersAddedQuantity ), with the number
    // being negative for listeners removed.

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
    this.removeAllListeners();

    if ( assert ) {
      this.isDisposed = true;
    }
  }

  /**
   * Notify listeners
   * @public
   */
  emit( ...args ) {
    assert && assert( !this.isDisposed, 'should not be called if disposed' );

    // optional callback, before notifying listeners
    this.onBeforeNotify && this.onBeforeNotify.apply( null, args );

    // Support for a query parameter that shuffles listeners, but bury behind assert so it will be stripped out on build
    // so it won't impact production performance.
    if ( assert && shuffleListeners ) {
      this.listeners = new Set( _.shuffle( Array.from( this.listeners ) ) ); // eslint-disable-line bad-sim-text
    }

    // Notify wired-up listeners, if any
    if ( this.listeners.size > 0 ) {

      const emitContext = {
        index: 0
        // listenerArray: [] // {Array.<function>|undefined} assigned if a mutation is made during emit
      };
      this.emitContexts.push( emitContext );

      for ( const listener of this.listeners ) {
        listener( ...args );
        emitContext.index++;

        // If a listener was added or removed, we cannot continue processing the mutated Set, we must switch to
        // iterate over the guarded array
        if ( emitContext.listenerArray ) {
          break;
        }
      }

      // If the listeners were guarded during emit, we bailed out on the for..of and continue iterating over the original
      // listeners in order from where we left off.
      if ( emitContext.listenerArray ) {
        for ( let i = emitContext.index; i < emitContext.listenerArray.length; i++ ) {
          emitContext.listenerArray[ i ]( ...args );
        }
      }
      this.emitContexts.pop();
    }
  }

  /**
   * Adds a listener which will be called during emit.
   * @param {function} listener
   * @public
   */
  addListener( listener ) {
    assert && assert( !this.isDisposed, 'Cannot add a listener to a disposed TinyEmitter' );
    assert && assert( !this.hasListener( listener ), 'Cannot add the same listener twice' );

    // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
    // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
    // removeListener.
    this.guardListeners();
    this.listeners.add( listener );

    this.changeCount && this.changeCount( 1 );
  }

  /**
   * Removes a listener
   * @param {function} listener
   * @public
   */
  removeListener( listener ) {

    // Throw an error when removing a non-listener (except when the Emitter has already been disposed, see
    // https://github.com/phetsims/sun/issues/394#issuecomment-419998231
    if ( assert && !this.isDisposed ) {
      assert( this.listeners.has( listener ), 'tried to removeListener on something that wasn\'t a listener' );
    }
    this.guardListeners();
    this.listeners.delete( listener );

    this.changeCount && this.changeCount( -1 );
  }

  /**
   * Removes all the listeners
   * @public
   */
  removeAllListeners() {

    const size = this.listeners.size;

    this.guardListeners();
    this.listeners.clear();

    this.changeCount && this.changeCount( -size );
  }

  /**
   * If listeners are added/removed while emit() is in progress, we must make a defensive copy of the array of listeners
   * before changing the array, and use it for the rest of the notifications until the emit call has completed.
   * @private
   */
  guardListeners() {

    for ( let i = this.emitContexts.length - 1; i >= 0; i-- ) {

      // Once we meet a level that was already guarded, we can stop, since all previous levels were already guarded
      if ( this.emitContexts[ i ].listenerArray ) {
        break;
      }
      else {

        // Mark copies as 'guarded' so that it will use the original listeners when emit started and not the modified
        // list.
        this.emitContexts[ i ].listenerArray = Array.from( this.listeners );
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
    return this.listeners.has( listener );
  }

  /**
   * Returns true if there are any listeners.
   * @returns {boolean}
   * @public
   */
  hasListeners() {
    assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
    return this.listeners.size > 0;
  }

  /**
   * Returns the number of listeners.
   * @returns {number}
   * @public
   */
  getListenerCount() {
    return this.listeners.size;
  }

  /**
   * Invokes a callback once for each listener
   * @param {function} callback - takes the listener as an argument
   * @public (Property)
   */
  forEachListener( callback ) {
    this.listeners.forEach( callback );
  }
}

axon.register( 'TinyEmitter', TinyEmitter );
export default TinyEmitter;