// Copyright 2022-2023, University of Colorado Boulder

/**
 * QUnit tests for Disposable
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Disposable from './Disposable.js';

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

