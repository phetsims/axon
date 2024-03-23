// Copyright 2022-2024, University of Colorado Boulder

/**
 * QUnit tests for Disposable
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Disposable, { DisposableOptions } from './Disposable.js';

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