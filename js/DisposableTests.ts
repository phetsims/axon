// Copyright 2022, University of Colorado Boulder

/**
 * QUnit tests for Disposable
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Disposable from './Disposable.js';

QUnit.module( 'DisposableTests' );

QUnit.test( 'PhetioObject disposer', assert => {
  assert.ok( true, 'initial test' );

  const object1 = new Disposable();
  const object2 = new Disposable( {
    disposer: object1
  } );

  assert.ok( !object1.isDisposed, '1 is not disposed' );
  assert.ok( !object2.isDisposed, '2 is not disposed' );

  object1.dispose();
  assert.ok( object1.isDisposed, '1 is disposed' );
  assert.ok( object2.isDisposed, '2 is disposed' );
} );

