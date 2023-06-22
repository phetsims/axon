// Copyright 2022-2023, University of Colorado Boulder

/**
 * A base class to help with managing disposal. Creates a disposeEmitter that will be fired when disposing. This occurs
 * AFTER all prototype dispose() methods have been called up the hierarchy, so be aware of potential disposal order
 * issues if using disposeEmitter and dispose() logic together.
 *
 * This class also includes a public flag set to true when disposed.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import TEmitter from './TEmitter.js';
import TinyEmitter from './TinyEmitter.js';

class Disposable {

  // Called after all code that is directly in `dispose()` methods, be careful with mixing this pattern and the
  // `this.disposeMyClass()` pattern.
  public readonly _disposeEmitter: TEmitter = new TinyEmitter();

  // Keep track if this instance supports disposing. If set to false, then an assertion will fire if trying to dispose
  // this instance.
  private _isDisposable = true;

  // Marked true when this Disposable has had dispose() called on it (after disposeEmitter is fired)
  private _isDisposed = false;

  // Disposable should only be used by subtypes, no need to instantiate one on its own.
  protected constructor() {
    if ( assert ) {

      // Wrap the prototype dispose method with a check. NOTE: We will not catch devious cases where the dispose() is
      // overridden after the Node constructor (which may happen).
      const protoDispose = this.dispose;
      this.dispose = () => {
        assert && assert( !this._isDisposed, 'This Disposable has already been disposed, and cannot be disposed again' );
        protoDispose.call( this );
        assert && assert( this._isDisposed, 'Disposable.dispose() call is missing from an overridden dispose method' );
      };
    }
  }

  public getDisposeEmitter(): TEmitter {
    return this._disposeEmitter;
  }

  public get disposeEmitter(): TEmitter {
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

  public dispose(): void {
    assert && !this.isDisposable && Disposable.assertNotDisposable();
    assert && assert( !this._isDisposed, 'Disposable can only be disposed once' );
    this._disposeEmitter.emit();
    this._disposeEmitter.dispose();
    this._isDisposed = true;
  }

  public static assertNotDisposable(): void {
    assert && assert( false, 'dispose is not supported, exists for the lifetime of the sim' );
  }
}

axon.register( 'Disposable', Disposable );
export default Disposable;
