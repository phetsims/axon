// Copyright 2015-2022, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';

// constants
const shuffleListeners = _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.shuffleListeners;

type EmitContext = {
  index: number;
  listenerArray?: Function[];
};
type Listener<T extends any[]> = ( ...args: T ) => void;

export default class TinyEmitter<T extends any[] = []> {

  // Not defined usually because of memory usage. If defined, this will be called when the listener count changes,
  // e.g. changeCount( {number} listenersAddedQuantity ), with the number being negative for listeners removed.
  changeCount?: ( count: number ) => void;

  // Only defined when assertions are enabled - to keep track if it has been disposed or not
  isDisposed?: boolean;

  // If specified, this will be called before listeners are notified.
  private readonly onBeforeNotify?: Listener<T> | null;

  // The listeners that will be called on emit
  private listeners: Set<Listener<T>>;

  // During emit() keep track of iteration progress and guard listeners if mutated during emit()
  private emitContexts: EmitContext[];

  constructor( onBeforeNotify?: Listener<T> | null ) {

    if ( onBeforeNotify ) {
      assert && assert( typeof onBeforeNotify === 'function', 'onBeforeNotify should be a function' );

      this.onBeforeNotify = onBeforeNotify;
    }

    this.listeners = new Set();

    this.emitContexts = [];

    // for production memory concerns; no need to keep this around.
    if ( assert ) {
      this.isDisposed = false;
    }
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  dispose(): void {
    this.removeAllListeners();

    if ( assert ) {
      this.isDisposed = true;
    }
  }

  /**
   * Notify listeners
   */
  emit( ...args: T ): void {
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

      const emitContext: EmitContext = {
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
   */
  addListener( listener: Listener<T> ): void {
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
   */
  removeListener( listener: Listener<T> ): void {

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
   */
  removeAllListeners(): void {

    const size = this.listeners.size;

    this.guardListeners();
    this.listeners.clear();

    this.changeCount && this.changeCount( -size );
  }

  /**
   * If listeners are added/removed while emit() is in progress, we must make a defensive copy of the array of listeners
   * before changing the array, and use it for the rest of the notifications until the emit call has completed.
   */
  private guardListeners(): void {

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
   */
  hasListener( listener: Listener<T> ): boolean {
    assert && assert( arguments.length === 1, 'Emitter.hasListener should be called with 1 argument' );
    return this.listeners.has( listener );
  }

  /**
   * Returns true if there are any listeners.
   */
  hasListeners(): boolean {
    assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
    return this.listeners.size > 0;
  }

  /**
   * Returns the number of listeners.
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Invokes a callback once for each listener - meant for Property's use
   */
  forEachListener( callback: ( listener: Listener<T> ) => void ): void {
    this.listeners.forEach( callback );
  }
}

axon.register( 'TinyEmitter', TinyEmitter );
