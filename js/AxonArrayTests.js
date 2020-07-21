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
  array.elementAddedEmitter.addListener( e => deltas.push( { type: 'added', value: e } ) );
  array.elementRemovedEmitter.addListener( e => deltas.push( { type: 'removed', value: e } ) );
  modifier( array );
  assert.deepEqual( deltas, expected );
};

QUnit.test( 'Test axon array length', function( assert ) {

  const array = new AxonArray();
  array.push( 'hello' );
  assert.equal( array.lengthProperty.value, 1, 'array length test' );
  array.pop();
  assert.equal( array.lengthProperty.value, 0, 'array length test' );
  array.push( 1, 2, 3 );
  assert.equal( array.lengthProperty.value, 3, 'array length test' );
  array.shift();
  assert.equal( array.lengthProperty.value, 2, 'array length test' );
  array.splice( 0, 2, 'parrot', 'anemone', 'blue' );
  assert.equal( array.lengthProperty.value, 3, 'array length test' );
  array.unshift( 'qunit', 'test' );
  assert.equal( array.lengthProperty.value, 5, 'array length test' );
  array.setLengthAndNotify( 0 );
  assert.equal( array.lengthProperty.value, 0, 'array length test after setLengthAndNotify' );
} );

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

QUnit.test( 'Test constructor arguments', function( assert ) {

  const a1 = new AxonArray( {
    length: 7
  } );
  assert.equal( a1.lengthProperty.value, 7, 'array length test' );
  a1.push( 'hello' );
  assert.equal( a1.lengthProperty.value, 8, 'array length test' );

  const a2 = new AxonArray( {
    values: [ 'hi', 'there' ]
  } );
  assert.equal( a2.length, 2, 'array length test' );

  let a3 = null;
  window.assert && assert.throws( function() {
    a3 = new AxonArray( { values: [ 3 ], length: 1 } );
  }, 'length and values are mutually exclusive' );
  assert.equal( a3, null, 'should not have been assigned' );
} );