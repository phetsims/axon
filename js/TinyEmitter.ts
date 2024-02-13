// Copyright 2015-2023, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import axon from './axon.js';
import TEmitter, { TEmitterListener, TEmitterParameter } from './TEmitter.js';
import Random from '../../dot/js/Random.js';
import dotRandom from '../../dot/js/dotRandom.js';

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
  console.log( 'listenerOrder random seed: ' + random.seed );
}

// While TinyEmitter doesn't use this in an optionize call, it is nice to be able to reuse the types of these options.
export type TinyEmitterOptions<T extends TEmitterParameter[] = []> = {
  onBeforeNotify?: TEmitterListener<T>;
  hasListenerOrderDependencies?: boolean;
  reentrantNotificationStrategy?: ReentrantNotificationStrategy;
};

export type ReentrantNotificationStrategy = 'queue' | 'stack';

type EmitContext<T extends IntentionalAny[]> = {
  index: number;
  listenerArray?: TEmitterListener<T>[];
  args: T;
};

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

  /**
   * How best to handle reentrant calls to emit()? There are two possibilities:
   * Stack: Each new reentrant call to emit (from a listener), takes precedent. This behaves like a "depth first"
   *        algorithm because it will not finish calling all listeners from the original call until nested emit() calls
   *        notify fully. See notifyAsStack().
   * Queue: Each new reentrant call to emit queues those listeners to run once the current notifications are done
   *        firing. Here a recursive (reentrant) emit is basically a noop, because the original call will continue
   *        looping through listeners from each new emit() call until there are no more. See notifyAsQueue().
   *
   * TODO: Instead of a default allocation, should we keep it optional and place the default inline in Emit? TODO: https://github.com/phetsims/axon/issues/447
   */
  private readonly reentrantNotificationStrategy: ReentrantNotificationStrategy = 'stack';

  // The listeners that will be called on emit
  private listeners: Set<TEmitterListener<T>>;

  // During emit() keep track of iteration progress and guard listeners if mutated during emit()
  private emitContexts: EmitContext<T>[];

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

    this.emitContexts = [];

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
    assert && assert( !this.isDisposed, 'should not be called if disposed' );

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

      // TODO: Pool emitContexts, figure out how to handle listenerArray already created. Same with args? https://github.com/phetsims/axon/issues/447
      const emitContext: EmitContext<T> = {
        index: 0,

        // TODO only needed for notify-queue, optimize? https://github.com/phetsims/axon/issues/447
        // We may not be able to emit right away. If we are already emitting and this is a recursive call, then that
        // first emit needs to finish notifying its listeners before we start our notifications.
        args: args //.slice() as T // TODO: do we need to slice? https://github.com/phetsims/axon/issues/447

        // listenerArray: [] // {Array.<function>|undefined} assigned if a mutation is made during emit
      };
      this.emitContexts.push( emitContext );

      if ( this.reentrantNotificationStrategy === 'queue' ) {
        this.notifyAsQueue();
      }
      else if ( this.reentrantNotificationStrategy === 'stack' ) {
        this.notifyAsStack( emitContext, args );
      }
      else {
        assert && assert( false, `Unknown reentrantNotificationStrategy: ${this.reentrantNotificationStrategy}` );
      }
    }
  }

  /**
   * Notify listeners from the emit call with "stack-like" behavior. We also sometimes call this "depth-first"
   * notification. This algorithm will prioritize the most recent emit call's listeners, such that reentrant emits
   * will cause a full recursive call to emit() to complete before continuing to notify the rest of the listeners from
   * the original call.
   *
   * Note this was the only method of notifying listeners on emit before 2/2024.
   */
  private notifyAsStack( emitContext: EmitContext<T>, args: T ): void {

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
    // TODO: factor this out with same loop in notifyAsQueue? https://github.com/phetsims/axon/issues/447
    if ( emitContext.listenerArray ) {
      for ( let i = emitContext.index; i < emitContext.listenerArray.length; i++ ) {
        emitContext.listenerArray[ i ]( ...args );
      }
    }
    this.emitContexts.pop();
  }

  /**
   * Notify listeners from the emit call with "queue-like" behavior (FIFO). We also sometimes call this "breadth-first"
   * notification. In this function, listeners for an earlier emit call will be called before any newer emit call that
   * may occur inside of listeners (in a reentrant case).
   *
   * This is a better strategy in cases where  order may matter, for example:
   * const emitter = new TinyEmitter<[ number ]>(  null, null, 'queue' );
   * emitter.addListener( number => {
   *   if ( number < 10 ) {
   *     emitter.emit( number + 1 );
   *     console.log( number );
   *   }
   * } );
   * emitter.emit( 1 );
   * -> 1,2,3,4,5,6,7,8,9
   *
   * Whereas `notifyAsQueue()` would yield the oppose order: 9->1
   *
   * Note, this algorithm does involve queueing a reentrant emit() calls' listeners for later notification. So in
   * effect, reentrant emit() calls are no-ops. This could potentially lead some awkward or confusing cases. As a
   * result it is recommended to use this predominantly with Properties, in which their stateful value makes more
   * sense to notify changes on in order (preserving the correct oldValue through all notifications).
   */
  private notifyAsQueue(): void {

    // This handles all reentrancy here (with a while loop), instead of doing so with recursion.
    if ( this.emitContexts.length === 1 ) {
      while ( this.emitContexts.length > 0 ) {

        // Don't remove it from the list here. We need to be able to guardListeners.
        const emitContext = this.emitContexts[ 0 ];

        // It is possible that this emitContext is later on in the while loop, and has already had a listenerArray set
        const listeners = emitContext.listenerArray || this.listeners;
        const startedWithListenerArray = !!emitContext.listenerArray;

        for ( const listener of listeners ) {
          listener( ...emitContext.args );
          emitContext.index++;

          // If a listener was added or removed, we cannot continue processing the mutated Set, we must switch to
          // iterate over the guarded array
          if ( !startedWithListenerArray && emitContext.listenerArray ) {
            break;
          }
        }

        // If the listeners were guarded during emit, we bailed out on the for...of and continue iterating over the original
        // listeners in order from where we left off.
        if ( !startedWithListenerArray && emitContext.listenerArray ) {
          for ( let i = emitContext.index; i < emitContext.listenerArray.length; i++ ) {
            emitContext.listenerArray[ i ]( ...emitContext.args );
          }
        }

        this.emitContexts.shift();
      }
    }
    else {
      assert && assert( this.emitContexts.length <= EMIT_CONTEXT_MAX_LENGTH,
        `emitting reentrant depth of ${EMIT_CONTEXT_MAX_LENGTH} seems like a infinite loop to me!` );
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

      // Once we meet a level that was already guarded, we can stop, since all previous levels were already guarded
      // TODO: wouldn't we need the below guard, since guarding the listeners may want to overwrite the new listeners
      //   for future contexts? I don't think so, but I can't help but feel like the listenerArray needs updating if a
      //   previous listener changed the listener. JO likely we should just delete this one, https://github.com/phetsims/axon/issues/447
      if ( /*i === 0 &&*/ this.emitContexts[ i ].listenerArray ) {
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

axon.register( 'TinyEmitter', TinyEmitter );
