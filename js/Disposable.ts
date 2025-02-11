// Copyright 2022-2025, University of Colorado Boulder

/**
 * A base class to help with managing disposal. Creates a disposeEmitter that will be fired when disposing. This occurs
 * AFTER all prototype dispose() methods have been called up the hierarchy, so be aware of potential disposal order
 * issues if using disposeEmitter and dispose() logic together.
 *
 * This class also includes a public flag set to true when disposed.
 *
 * You can also opt into asserting out when disposing, preventing disposal on your class, see Disposable.isDisposable
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import affirm, { isAffirmEnabled } from '../../perennial-alias/js/browser-and-node/affirm.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import axon from './axon.js';
import type TEmitter from './TEmitter.js';
import { type TReadOnlyEmitter } from './TEmitter.js';
import TinyEmitter from './TinyEmitter.js';

// A "disposer" is a Type for another entity that can be responsible for disposing this instance. This type is much better
// than directly tying this to the Disposable class.
type Disposer = {
  disposeEmitter: TReadOnlyEmitter;
};

export type DisposerOptions = {
  disposer?: Disposer; // if provided, an "unregistration" will occur for this Disposable when the disposer is disposed.
};

type HasDispose = {
  dispose: VoidFunction;
};

// Specify possible target types to avoid typos. Please add more types here as needed.
type DisposerActionType = 'link' | 'listener' | 'inputListener';

type DisposerActionMap = Map<IntentionalAny, { disposer: Disposer; unregisterCallback: VoidFunction }>;

// Used in subclasses to support mutate.
export type DisposableOptions = {
  isDisposable?: boolean;
};

class Disposable implements Disposer, HasDispose {

  // Called after all code that is directly in `dispose()` methods. Be careful with mixing this pattern and the
  // `this.disposeMyClass()` pattern.
  private readonly _disposeEmitter: TEmitter = new TinyEmitter();

  // Keep track if this instance supports disposing. If set to false, then an assertion will fire if trying to dispose
  // this instance.
  private _isDisposable = true;

  // Marked true when this Disposable has had dispose() called on it (after disposeEmitter is fired)
  private _isDisposed = false;

  // Keep track of disposers that are added to this instance, so that they can be removed when:
  // (a) the target is removed via another mechanism (like unlink(), or that Property being disposed)
  // (b) the disposer is disposed
  // Keep track of each type of target type separately, in case we ever have one container that has multiple types of
  // targets, like a Model that has both link() and addListener()
  private disposerMap?: Map<DisposerActionType, DisposerActionMap>;

  // Most time, Disposable should only be used by subtypes, only instantiate it if you run into multiple inheritance issues.
  public constructor( providedOptions?: DisposableOptions ) {

    providedOptions && this.initializeDisposable( providedOptions );

    if ( isAffirmEnabled() ) {

      // Wrap the prototype dispose method with a check. NOTE: We will not catch devious cases where the dispose() is
      // overridden after the Node constructor (which may happen).
      const protoDispose = this.dispose;
      this.dispose = () => {
        affirm( !this._isDisposed, 'This Disposable has already been disposed, and cannot be disposed again' );
        protoDispose.call( this );
        affirm( this._isDisposed, 'Disposable.dispose() call is missing from an overridden dispose method' );
      };
    }
  }

  public getDisposeEmitter(): TReadOnlyEmitter {
    return this._disposeEmitter;
  }

  public get disposeEmitter(): TReadOnlyEmitter {
    return this.getDisposeEmitter();
  }

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  public get isDisposable(): boolean {
    return this._isDisposable;
  }

  public set isDisposable( isDisposable: boolean ) {
    this._isDisposable = isDisposable;
  }

  public initializeDisposable( options?: DisposableOptions ): void {
    if ( options && options.hasOwnProperty( 'isDisposable' ) ) {
      this._isDisposable = options.isDisposable!;
    }
  }

  /**
   * Add disposables that will be disposed when this instance is disposed.
   */
  public addDisposable( ...disposables: HasDispose[] ): void {
    this.disposeEmitter.addListener( () => {
      for ( let i = 0; i < disposables.length; i++ ) {
        disposables[ i ].dispose();
      }
    } );
  }

  public dispose(): void {
    isAffirmEnabled() && !this._isDisposable && Disposable.assertNotDisposable();
    affirm( !this._isDisposed, 'Disposable can only be disposed once' );

    // Unregister any disposers that were responsible for a portion of ths instance's cleanup, since it is getting
    // disposed. Do this before disposing this class.
    if ( this.disposerMap ) {
      for ( const [ disposerActionType ] of this.disposerMap ) {
        this.removeAllDisposerActions( disposerActionType );
      }
    }

    this._disposeEmitter.emit();
    this._disposeEmitter.dispose();

    this._isDisposed = true;
  }

  /**
   * Adds an action for the target to the disposeEmitter for the given disposer, so that when the disposer is disposed,
   * the unregisterAction related to this instance is also called. For instance, the unregisterAction would be the
   * corresponding removal/unlink/removeInputListener.
   * It is assumed that the target and unregisterAction are related to the memory management of this instance.
   */
  public addDisposerAction( disposerActionType: DisposerActionType, target: IntentionalAny, disposer: Disposer, unregisterAction: () => void ): void {

    this.disposerMap = this.disposerMap || new Map();
    if ( !this.disposerMap.has( disposerActionType ) ) {
      this.disposerMap.set( disposerActionType, new Map() );
    }

    const entries = this.disposerMap.get( disposerActionType )!;
    affirm( !entries.has( target ), `Target already registered for disposer action type: ${disposerActionType}`, target );

    // Function that will unregister the disposer action for the target.
    const unregisterActionCallback = () => {
      entries.delete( target );
      unregisterAction();
    };
    entries.set( target, { disposer: disposer, unregisterCallback: unregisterActionCallback } );
    disposer.disposeEmitter.addListener( unregisterActionCallback );
  }

  /**
   * Remove the target on the disposer's disposeEmitter. This will not call the unregistration.
   */
  public removeDisposerAction( disposerActionType: DisposerActionType, target: IntentionalAny ): void {
    if ( this.disposerMap ) {

      const disposers = this.disposerMap.get( disposerActionType );
      if ( disposers ) {
        const entry = disposers.get( target );

        // If there is no entry, that means either:
        // a) this particular target was never registered with a disposer, which is fine.
        // b) or it has already been removed via the disposeEmitter or elsewhere.
        // Graceful is best here to avoid disposal order dependencies.
        if ( entry ) {
          entry.disposer.disposeEmitter.removeListener( entry.unregisterCallback );
          disposers.delete( target );
        }

        // NOTE: Do not delete any of the Maps, as they may be used again in the future.
      }
    }
  }

  // Remove all disposer actions for a given type
  public removeAllDisposerActions( disposerActionType: DisposerActionType ): void {
    if ( this.disposerMap ) {
      const disposers = this.disposerMap.get( disposerActionType );
      disposers && disposers.forEach( ( _, target ) => this.removeDisposerAction( disposerActionType, target ) );
    }
  }

  public static assertNotDisposable(): void {

    // eslint-disable-next-line phet/bad-sim-text
    affirm( false, 'dispose is not supported, exists for the lifetime of the sim' );
  }
}

axon.register( 'Disposable', Disposable );
export default Disposable;