// Copyright 2022-2025, University of Colorado Boulder

/**
 * QUnit tests for Disposable
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from './BooleanProperty.js';
import Disposable, { type DisposableOptions } from './Disposable.js';

QUnit.module( 'Disposable' );

QUnit.test( 'Disposable basics', assert => {
  assert.ok( true, 'initial test' );

  class MyDisposable extends Disposable {
    public constructor() { super();}
  }

  const object1 = new MyDisposable();
  assert.ok( !!object1.disposeEmitter, 'disposeEmitter needed' );
  const object2 = new MyDisposable();
  object1.disposeEmitter.addListener( () => object2.dispose() );

  assert.ok( !object1.isDisposed, '1 is not disposed' );
  assert.ok( !object2.isDisposed, '2 is not disposed' );

  object1.dispose();
  assert.ok( object1.isDisposed, '1 is disposed' );
  assert.ok( object2.isDisposed, '2 is disposed' );

  // @ts-expect-error isDisposed is not on TEmitter, but should be in place if assertions are enabled
  window.assert && assert.ok( object1.disposeEmitter.isDisposed, 'disposeEmitter should be disposed too' );
} );


QUnit.test( 'Disposable.isDisposable', assert => {
  assert.ok( true, 'when assertions are not enabled' );

  class MyDisposable extends Disposable {
    public constructor( options?: DisposableOptions ) {super( options );}
  }

  const object1 = new MyDisposable( {
    isDisposable: true
  } );
  const object2 = new MyDisposable();

  object1.dispose();
  object2.dispose();

  const object3 = new MyDisposable( {
    isDisposable: false
  } );
  const object4 = new MyDisposable();
  object4.isDisposable = false;

  if ( window.assert ) {
    assert.throws( () => object3.dispose(), 'should throw if isDisposable is false1' );
    assert.throws( () => object4.dispose(), 'should throw if isDisposable is false2' );
  }
} );

QUnit.test( 'Disposable.addDisposer', assert => {
  assert.ok( true, 'when assertions are not enabled' );

  class Model extends Disposable {
    public readonly myProperty = new BooleanProperty( false );
    private readonly myListener: () => void;

    public constructor() {
      super();
      this.myListener = () => console.log( 'link called back' );
      this.myProperty.link( this.myListener, { disposer: this } );

      const b = () => console.log( 'second link' );
      this.myProperty.link( b );
      this.myProperty.unlink( b );
    }

    public detachListener(): void {
      this.myProperty.unlink( this.myListener );
    }
  }

  {
    const model = new Model();

    // @ts-expect-error disposeEmitter is a TEmitter.
    const listenerCount = model.disposeEmitter[ 'listeners' ];
    assert.ok( listenerCount.size === 1, 'disposer wired up on construction' );
    assert.ok( model.myProperty.hasListeners(), 'after creating the model, it should have a listerer' );
    model.detachListener();
    assert.ok( !model.myProperty.hasListeners(), 'after disposing the model, it should not have a listener' );
  }
  {
    const model = new Model();
    model.dispose();
    assert.ok( !model.myProperty.hasListeners(), 'after disposing the model, it should not have a listener' );
  }
  {
    const model = new Model();

    // @ts-expect-error disposeEmitter is a TEmitter.
    const listenersSet = model.disposeEmitter[ 'listeners' ];
    const listenerCount = listenersSet.size;
    model.myProperty.dispose();
    assert.ok( !model.myProperty.hasListeners(), 'after disposing the model, it should not have a listener' );
    if ( window.assert ) {
      for ( const [ key, value ] of model.myProperty[ 'disposerMap' ]!.entries() ) {
        assert.ok( value.size === 0, `after disposing the Property, it should not have any lingering disposers: ${key}` );
      }
    }
    assert.ok( listenersSet.size === listenerCount - 1, 'disposing Property should remove the listener on model.disposeEmitter' );
  }
} );