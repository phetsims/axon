// Copyright 2020, University of Colorado Boulder

/**
 * QUnit tests for ObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import AxonArray from './AxonArray.js';

QUnit.module( 'Axon Array' );

// Creates an array that is tested with the given modifiers against the expected results.
const testArrayEmitters = ( assert, modifier, expected ) => {
  const array = new AxonArray();
  const deltas = [];
  array.itemAddedEmitter.addListener( e => deltas.push( { type: 'added', value: e } ) );
  array.itemRemovedEmitter.addListener( e => deltas.push( { type: 'removed', value: e } ) );
  modifier( array );
  assert.deepEqual( deltas, expected );
};

QUnit.test( 'Test axon array', function( assert ) {

  testArrayEmitters( assert, array => {

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
  }, [
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

QUnit.test( 'Test axon array setLengthAndNotify', function( assert ) {
  testArrayEmitters( assert, array => {
    array.push( 'hello' );
    array.setLengthAndNotify( 0 );
    array.setLengthAndNotify( 4 );
  }, [
    { type: 'added', value: 'hello' },
    { type: 'removed', value: 'hello' },
    { type: 'added', value: undefined },
    { type: 'added', value: undefined },
    { type: 'added', value: undefined },
    { type: 'added', value: undefined }
  ] );
} );

QUnit.test( 'Test AxonArray.push', function( assert ) {
  testArrayEmitters( assert, array => {
    array.push( 'hello', 'there', 'old', undefined );
  }, [
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'there' },
    { type: 'added', value: 'old' },
    { type: 'added', value: undefined }
  ] );
} );

QUnit.test( 'Test AxonArray.pop', function( assert ) {
  testArrayEmitters( assert, array => {
    array.push( 7 );
    const popped = array.pop();
    assert.equal( popped, 7 );
  }, [
    { type: 'added', value: 7 },
    { type: 'removed', value: 7 }
  ] );
} );

QUnit.test( 'Test AxonArray.shift', function( assert ) {
  testArrayEmitters( assert, array => {
    array.push( 7, 3 );
    const removed = array.shift();
    assert.equal( removed, 7 );
  }, [
    { type: 'added', value: 7 },
    { type: 'added', value: 3 },
    { type: 'removed', value: 7 }
  ] );
} );

QUnit.test( 'Test AxonArray.unshift', function( assert ) {

  // From this example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
  testArrayEmitters( assert, array => {
    array.push( 'angel', 'clown', 'drum', 'sturgeon' );
    array.unshift( 'trumpet', 'dino' );
  }, [
    { type: 'added', value: 'angel' },
    { type: 'added', value: 'clown' },
    { type: 'added', value: 'drum' },
    { type: 'added', value: 'sturgeon' },
    { type: 'added', value: 'trumpet' },
    { type: 'added', value: 'dino' }
  ] );
} );