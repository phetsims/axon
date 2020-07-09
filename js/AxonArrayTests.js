// Copyright 2017-2020, University of Colorado Boulder

/**
 * QUnit tests for ObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import AxonArray from './AxonArray.js';

QUnit.module( 'Axon Array' );

QUnit.test( 'Test axon array', function( assert ) {
  const array = new AxonArray();

  const deltas = [];

  array.itemAddedEmitter.addListener( e => deltas.push( { type: 'added', value: e } ) );
  array.itemRemovedEmitter.addListener( e => deltas.push( { type: 'removed', value: e } ) );

  assert.ok( true, 'first test' );
  array.push( 'test' );
  array.push( 'test' );
  array.push( 'test' );
  array.push( 'test' );

  array.setLengthAndNotify( 1 );

  array.pop();
  array.push( 'hello' );
  array.push( 'hello' );
  array.push( 'hello' );
  array.push( 'time' );
  arrayRemove( array, 'hello' );

  assert.deepEqual( deltas, [
    { type: 'added', value: 'test' },
    { type: 'added', value: 'test' },
    { type: 'added', value: 'test' },
    { type: 'added', value: 'test' },
    { type: 'removed', value: 'test' },
    { type: 'removed', value: 'test' },
    { type: 'removed', value: 'test' },
    { type: 'removed', value: 'test' },
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'time' },
    { type: 'removed', value: 'hello' }
  ] );
} );