// Copyright 2015-2025, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import dotRandom from '../../dot/js/dotRandom.js';
import Random from '../../dot/js/Random.js';
import Pool, { type TPoolable } from '../../phet-core/js/Pool.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import axon from './axon.js';
import type TEmitter from './TEmitter.js';
import { type TEmitterListener, type TEmitterParameter } from './TEmitter.js';

// constants
const listenerOrder = _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.listenerOrder;
const listenerLimit = _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.listenerLimit;

const EMIT_CONTEXT_MAX_LENGTH = 1000;

let random: Random | null = null;
if ( listenerOrder && listenerOrder.startsWith( 'random' ) ) {

  // NOTE: this regular expression must be maintained in initialize-globals as well.
  const match = listenerOrder.match( /random(?:%28|\()(\d+)(?:%29|\))/ );
  const seed = match ? Number( match[ 1 ] ) : dotRandom.nextInt( 1000000 );
  random = new Random( { seed: seed } );
  console.log( 'listenerOrder random seed: ' + seed );
}

/**
 * How to handle the notification of listeners in reentrant emit() cases. There are two possibilities:
 * 'stack': Each new reentrant call to emit (from a listener), takes precedent. This behaves like a "depth first"
 *        algorithm because it will not finish calling all listeners from the original call until nested emit() calls
 *        notify fully. Notify listeners from the emit call with "stack-like" behavior. We also sometimes call this
 *        "depth-first" notification. This algorithm will prioritize the most recent emit call's listeners, such that
 *        reentrant emits will cause a full recursive call to emit() to complete before continuing to notify the
 *        rest of the listeners from the original call.
 *        Note: This was the only method of notifying listeners on emit before 2/2024.
 *
 * 'queue': Each new reentrant call to emit queues those listeners to run once the current notifications are done
 *        firing. Here a recursive (reentrant) emit is basically a noop, because the original call will continue
 *        looping through listeners from each new emit() call until there are no more. See notifyAsQueue().
 *        Notify listeners from the emit call with "queue-like" behavior (FIFO). We also sometimes call this "breadth-first"
 *        notification. In this function, listeners for an earlier emit call will be called before any newer emit call that
 *        may occur inside of listeners (in a reentrant case).
 *
 *        This is a better strategy in cases where order may matter, for example:
 *        const emitter = new TinyEmitter<[ number ]>(  null, null, 'queue' );
 *        emitter.addListener( number => {
 *          if ( number < 10 ) {
 *            emitter.emit( number + 1 );
 *            console.log( number );
 *          }
 *        } );
 *        emitter.emit( 1 );
 *        -> 1,2,3,4,5,6,7,8,9
 *
 *        Whereas stack-based notification would yield the oppose order: 9->1, since the most recently called emit
 *        would be the very first one notified.
 *
 *        Note, this algorithm does involve queueing a reentrant emit() calls' listeners for later notification. So in
 *        effect, reentrant emit() calls are no-ops. This could potentially lead some awkward or confusing cases. As a
 *        result it is recommended to use this predominantly with Properties, in which their stateful value makes more
 *        sense to notify changes on in order (preserving the correct oldValue through all notifications).
 */
export type ReentrantNotificationStrategy = 'queue' | 'stack';

// While TinyEmitter doesn't use this in an optionize call, it is nice to be able to reuse the types of these options.
export type TinyEmitterOptions<T extends TEmitterParameter[] = []> = {
  onBeforeNotify?: TEmitterListener<T>;
  hasListenerOrderDependencies?: boolean;
  reentrantNotificationStrategy?: ReentrantNotificationStrategy;
};

type ParameterList = IntentionalAny[];

// Store the number of listeners from the single TinyEmitter instance that has the most listeners in the whole runtime.
let maxListenerCount = 0;

export default class TinyEmitter<T extends TEmitterParameter[] = []> implements TEmitter<T> {

  // Not defined usually because of memory usage. If defined, this will be called when the listener count changes,
  // e.g. changeCount( {number} listenersAddedQuantity ), with the number being negative for listeners removed.
  public changeCount?: ( count: number ) => void;

  // Only defined when assertions are enabled - to keep track if it has been disposed or not
  public isDisposed?: boolean;

  // If specified, this will be called before listeners are notified.
  // NOTE: This is set ONLY if it's non-null
  private readonly onBeforeNotify?: TEmitterListener<T>;

  // If specified as true, this flag will ensure that listener order never changes (like via ?listenerOrder=random)
  // NOTE: This is set ONLY if it's actually true
  private readonly hasListenerOrderDependencies?: true;

  // How best to handle reentrant calls to emit(). Defaults to stack. See full doc where the Type is declared.
  private readonly reentrantNotificationStrategy?: ReentrantNotificationStrategy;

  // The listeners that will be called on emit
  private listeners: Set<TEmitterListener<T>>;

  // During emit() keep track of iteration progress and guard listeners if mutated during emit()
  private emitContexts: EmitContext<T>[] = [];

  // Null on parameters is a no-op
  public constructor( onBeforeNotify?: TinyEmitterOptions<T>['onBeforeNotify'] | null,
                      hasListenerOrderDependencies?: TinyEmitterOptions<T>['hasListenerOrderDependencies'] | null,
                      reentrantNotificationStrategy?: TinyEmitterOptions<T>['reentrantNotificationStrategy'] | null ) {

    if ( onBeforeNotify ) {
      this.onBeforeNotify = onBeforeNotify;
    }

    if ( hasListenerOrderDependencies ) {
      this.hasListenerOrderDependencies = hasListenerOrderDependencies;
    }

    if ( reentrantNotificationStrategy ) {
      this.reentrantNotificationStrategy = reentrantNotificationStrategy;
    }

    // Listener order is preserved in Set
    this.listeners = new Set();

    // for production memory concerns; no need to keep this around.
    if ( assert ) {
      this.isDisposed = false;
    }
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  public dispose(): void {
    this.removeAllListeners();

    if ( assert ) {
      this.isDisposed = true;
    }
  }

  /**
   * Notify listeners
   */
  public emit( ...args: T ): void {
    assert && assert( !this.isDisposed, 'TinyEmitter.emit() should not be called if disposed.' );

    // optional callback, before notifying listeners
    this.onBeforeNotify && this.onBeforeNotify.apply( null, args );

    // Support for a query parameter that shuffles listeners, but bury behind assert so it will be stripped out on build
    // so it won't impact production performance.
    if ( assert && listenerOrder && ( listenerOrder !== 'default' ) && !this.hasListenerOrderDependencies ) {
      const asArray = Array.from( this.listeners );

      const reorderedListeners = listenerOrder.startsWith( 'random' ) ? random!.shuffle( asArray ) : asArray.reverse();
      this.listeners = new Set( reorderedListeners );
    }

    // Notify wired-up listeners, if any
    if ( this.listeners.size > 0 ) {

      // We may not be able to emit right away. If we are already emitting and this is a recursive call, then that
      // first emit needs to finish notifying its listeners before we start our notifications (in queue mode), so store
      // the args for later. No slice needed, we're not modifying the args array.
      const emitContext = EmitContext.create( 0, args );
      this.emitContexts.push( emitContext );

      if ( this.reentrantNotificationStrategy === 'queue' ) {

        // This handles all reentrancy here (with a while loop), instead of doing so with recursion. If not the first context, then no-op because a previous call will handle this call's listener notifications.
        if ( this.emitContexts.length === 1 ) {
          while ( this.emitContexts.length ) {

            // Don't remove it from the list here. We need to be able to guardListeners.
            const emitContext = this.emitContexts[ 0 ];

            // It is possible that this emitContext is later on in the while loop, and has already had a listenerArray set
            const listeners = emitContext.hasListenerArray ? emitContext.listenerArray : this.listeners;

            this.notifyLoop( emitContext, listeners );

            this.emitContexts.shift()?.freeToPool();
          }
        }
        else {
          assert && assert( this.emitContexts.length <= EMIT_CONTEXT_MAX_LENGTH,
            `emitting reentrant depth of ${EMIT_CONTEXT_MAX_LENGTH} seems like a infinite loop to me!` );
        }
      }
      else if ( !this.reentrantNotificationStrategy || this.reentrantNotificationStrategy === 'stack' ) {
        this.notifyLoop( emitContext, this.listeners );
        this.emitContexts.pop()?.freeToPool();
      }
      else {
        assert && assert( false, `Unknown reentrantNotificationStrategy: ${this.reentrantNotificationStrategy}` );
      }
    }
  }

  /**
   * Execute the notification of listeners (from the provided context and list). This function supports guarding against
   * if listener order changes during the notification process, see guardListeners.
   */
  private notifyLoop( emitContext: EmitContext<T>, listeners: TEmitterListener<T>[] | Set<TEmitterListener<T>> ): void {
    const args = emitContext.args;

    for ( const listener of listeners ) {
      listener( ...args );

      emitContext.index++;

      // If a listener was added or removed, we cannot continue processing the mutated Set, we must switch to
      // iterate over the guarded array
      if ( emitContext.hasListenerArray ) {
        break;
      }
    }

    // If the listeners were guarded during emit, we bailed out on the for..of and continue iterating over the original
    // listeners in order from where we left off.
    if ( emitContext.hasListenerArray ) {
      for ( let i = emitContext.index; i < emitContext.listenerArray.length; i++ ) {
        emitContext.listenerArray[ i ]( ...args );
      }
    }
  }

  /**
   * Adds a listener which will be called during emit.
   */
  public addListener( listener: TEmitterListener<T> ): void {
    assert && assert( !this.isDisposed, 'Cannot add a listener to a disposed TinyEmitter' );
    assert && assert( !this.hasListener( listener ), 'Cannot add the same listener twice' );

    // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
    // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
    // removeListener.
    this.guardListeners();
    this.listeners.add( listener );

    this.changeCount && this.changeCount( 1 );

    if ( assert && listenerLimit && isFinite( listenerLimit ) && maxListenerCount < this.listeners.size ) {
      maxListenerCount = this.listeners.size;
      console.log( `Max TinyEmitter listeners: ${maxListenerCount}` );
      assert( maxListenerCount <= listenerLimit, `listener count of ${maxListenerCount} above ?listenerLimit=${listenerLimit}` );
    }
  }

  /**
   * Removes a listener
   */
  public removeListener( listener: TEmitterListener<T> ): void {

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
  public removeAllListeners(): void {

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

      const emitContext = this.emitContexts[ i ];

      // Once we meet a level that was already guarded, we can stop, since all previous levels were already guarded
      if ( emitContext.hasListenerArray ) {
        break;
      }

      // Mark copies as 'guarded' so that it will use the original listeners when emit started and not the modified
      // list.
      emitContext.listenerArray.push( ...this.listeners );
      emitContext.hasListenerArray = true;
    }
  }

  /**
   * Checks whether a listener is registered with this Emitter
   */
  public hasListener( listener: TEmitterListener<T> ): boolean {
    assert && assert( arguments.length === 1, 'Emitter.hasListener should be called with 1 argument' );
    return this.listeners.has( listener );
  }

  /**
   * Returns true if there are any listeners.
   */
  public hasListeners(): boolean {
    assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
    return this.listeners.size > 0;
  }

  /**
   * Returns the number of listeners.
   */
  public getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Invokes a callback once for each listener - meant for Property's use
   */
  public forEachListener( callback: ( listener: TEmitterListener<T> ) => void ): void {
    this.listeners.forEach( callback );
  }
}

/**
 * Utility class for managing the context of an emit call. This is used to manage the state of the emit call, and
 * especially to handle reentrant emit calls (through the stack/queue notification strategies)
 */
class EmitContext<T extends ParameterList = ParameterList> implements TPoolable {
  // Gets incremented with notifications
  public index!: number;

  // Arguments that the emit was called with
  public args!: T;

  // Whether we should act like there is a listenerArray (has it been copied?)
  public hasListenerArray = false;

  // Only use this if hasListenerArray is true. NOTE: for performance, we're not using getters/etc.
  public listenerArray: TEmitterListener<T>[] = [];

  public constructor( index: number, args: T ) {
    this.initialize( index, args );
  }

  public initialize( index: number, args: T ): this {
    this.index = index;
    this.args = args;
    this.hasListenerArray = false;

    return this;
  }

  public freeToPool(): void {
    EmitContext.pool.freeToPool( this );

    // NOTE: If we have fewer concerns about memory in the future, we could potentially improve performance by
    // removing the clearing out of memory here. We don't seem to create many EmitContexts, HOWEVER if we have ONE
    // "more re-entrant" case on sim startup that references a BIG BIG object, it could theoretically keep that
    // object alive forever.

    // We want to null things out to prevent memory leaks. Don't tell TypeScript!
    // (It will have the correct types after the initialization, so this works well with our pooling pattern).
    this.args = null as unknown as T;

    // Clear out the listeners array, so we don't leak memory while we are in the pool. If we have less concerns
    this.listenerArray.length = 0;
  }

  public static readonly pool = new Pool( EmitContext, {
    initialize: EmitContext.prototype.initialize
  } );

  public static create<T extends ParameterList>( index: number, args: T ): EmitContext<T> {
    // TypeScript doesn't need to know that we're using this for different types. When it is "active", it will be
    // the correct type.
    return EmitContext.pool.create( index, args ) as unknown as EmitContext<T>;
  }
}

axon.register( 'TinyEmitter', TinyEmitter );