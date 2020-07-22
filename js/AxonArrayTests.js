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

QUnit.test( 'Test axon array length', assert => {

  const array = new AxonArray();
  array.push( 'hello' );
  assert.equal( array.lengthProperty.value, 1, 'array lengthProperty test' );
  assert.equal( array.length, 1, 'array length test' );
  array.pop();
  assert.equal( array.lengthProperty.value, 0, 'array lengthProperty test' );
  assert.equal( array.length, 0, 'array length test' );
  array.push( 1, 2, 3 );
  assert.equal( array.lengthProperty.value, 3, 'array lengthProperty test' );
  assert.equal( array.length, 3, 'array length test' );
  array.shift();
  assert.equal( array.lengthProperty.value, 2, 'array lengthProperty test' );
  assert.equal( array.length, 2, 'array length test' );
  array.splice( 0, 2, 'parrot', 'anemone', 'blue' );
  assert.equal( array.lengthProperty.value, 3, 'array lengthProperty test' );
  assert.equal( array.length, 3, 'array length test' );
  array.unshift( 'qunit', 'test' );
  assert.equal( array.lengthProperty.value, 5, 'array lengthProperty test' );
  assert.equal( array.length, 5, 'array length test' );
  array.setLengthAndNotify( 0 );
  assert.equal( array.lengthProperty.value, 0, 'array lengthProperty test after setLengthAndNotify' );
  assert.equal( array.length, 0, 'array length test after setLengthAndNotify' );
} );

QUnit.test( 'Test axon array', assert => {

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

QUnit.test( 'Test axon array setLengthAndNotify', assert => {
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

QUnit.test( 'Test AxonArray.push', assert => {
  testArrayEmitters( assert, array => {
    array.push( 'hello', 'there', 'old', undefined );
  }, [
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'there' },
    { type: 'added', value: 'old' },
    { type: 'added', value: undefined }
  ] );
} );

QUnit.test( 'Test AxonArray.pop', assert => {
  testArrayEmitters( assert, array => {
    array.push( 7 );
    const popped = array.pop();
    assert.equal( popped, 7 );
  }, [
    { type: 'added', value: 7 },
    { type: 'removed', value: 7 }
  ] );
} );

QUnit.test( 'Test AxonArray.shift', assert => {
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

QUnit.test( 'Test AxonArray.unshift', assert => {

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

QUnit.test( 'Test constructor arguments', assert => {

  const a1 = new AxonArray( {
    length: 7
  } );
  assert.equal( a1.lengthProperty.value, 7, 'array length test' );
  a1.push( 'hello' );
  assert.equal( a1.lengthProperty.value, 8, 'array length test' );
  assert.equal( a1[ 7 ], 'hello', 'for push, element should be added at the end of the array' );

  const a2 = new AxonArray( {
    elements: [ 'hi', 'there' ]
  } );
  assert.equal( a2.length, 2, 'array length test' );
  assert.equal( a2[ 0 ], 'hi', 'first element correct' );
  assert.equal( a2[ 1 ], 'there', 'second element correct' );
  assert.equal( a2.length, 2, 'length correct' );

  let a3 = null;
  window.assert && assert.throws( () => {
    a3 = new AxonArray( { elements: [ 3 ], length: 1 } );
  }, 'length and elements are mutually exclusive' );
  assert.equal( a3, null, 'should not have been assigned' );

  // valid element types should succeed
  const a4 = new AxonArray( {
    elements: [ 'a', 'b' ],
    elementOptions: {
      valueType: 'string'
    }
  } );
  assert.ok( !!a4, 'correct element types should succeed' );

  // invalid element types should fail
  window.assert && assert.throws( () => new AxonArray( {
    elements: [ 'a', 'b' ],
    elementOptions: {
      valueType: 'number'
    }
  } ), 'should fail for invalid element types' );

} );