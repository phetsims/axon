// Copyright 2022, University of Colorado Boulder

/**
 * Type to implement disposal strategies, with a disposer option and a disposeEmitter.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import TEmitter from './TEmitter.js';
import TinyEmitter from './TinyEmitter.js';

type TDisposable = {
  disposeEmitter: TEmitter;
};

export type Disposer = TEmitter | TDisposable;

export type DisposableOptions = {

  // When set, this is the object that is responsible for triggering disposal for this object. This Disposable will listen
  // for when the disposer calls dispose (via the disposeEmitter), and then will dispose itself.
  disposer?: Disposer | null;
};

class Disposable implements TDisposable {

  public readonly disposeEmitter: TEmitter = new TinyEmitter();
  public isDisposed = false;
  private _disposer: Disposer | null = null;
  private boundOnDisposer: ( () => void ) | null = null;

  public constructor( providedOptions?: DisposableOptions ) {

    if ( providedOptions && providedOptions.disposer ) {
      this.disposer = providedOptions.disposer;
    }

    if ( assert ) {

      // Wrap the prototype dispose method with a check. NOTE: We will not catch devious cases where the dispose() is
      // overridden after the Node constructor (which may happen).
      const protoDispose = this.dispose;
      this.dispose = () => {
        assert && assert( !this.isDisposed, 'This Disposable has already been disposed, and cannot be disposed again' );
        protoDispose.call( this );
        assert && assert( this.isDisposed, 'Disposable.dispose() call is missing from an overridden dispose method' );
      };
    }
  }

  private onDisposer(): void {
    this.dispose();

    this.clearDisposer();
  }

  public getDisposer(): Disposer | null {
    return this._disposer;
  }

  public get disposer(): Disposer | null { return this.getDisposer(); }

  public set disposer( disposer: Disposer | null ) { this.setDisposer( disposer ); }

  public setDisposer( disposer: Disposer | null ): void {

    if ( disposer !== this._disposer ) {

      this.ensureBoundOnDisposer();

      this.clearDisposer();

      this._disposer = disposer;
      if ( this._disposer ) {


        assert && assert( this.boundOnDisposer, 'must have a boundOnDisposer' );

        this.getDisposerEmitter().addListener( this.boundOnDisposer! );
      }
    }
  }

  // Lazily create boundOnDisposer only when disposer is set
  private ensureBoundOnDisposer(): void {
    this.boundOnDisposer = this.boundOnDisposer || this.onDisposer.bind( this );
  }

  private getDisposerEmitter(): TEmitter {
    assert && assert( this._disposer, 'need a disposer set' );

    // type case because instanceof check isn't flexible enough to check for all that implement TDisposable
    return ( this._disposer instanceof Disposable ? this._disposer.disposeEmitter : this._disposer ) as TEmitter;
  }

  public clearDisposer(): void {

    // graceful
    if ( this._disposer ) {

      this.ensureBoundOnDisposer();

      assert && assert( this.boundOnDisposer, 'must have a boundOnDisposer' );
      this.getDisposerEmitter().removeListener( this.boundOnDisposer! );
      this._disposer = null;
    }
  }

  public dispose(): void {
    assert && assert( !this.isDisposed, 'Disposable can only be disposed once' );
    this.disposeEmitter.emit();
    this.isDisposed = true;
  }
}

axon.register( 'Disposable', Disposable );
export default Disposable;
