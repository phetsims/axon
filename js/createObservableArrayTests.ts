// Copyright 2020-2022, University of Colorado Boulder

/**
 * QUnit tests for createObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Random from '../../dot/js/Random.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import createObservableArray, { ObservableArray } from './createObservableArray.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

QUnit.module( 'createObservableArray' );

type runCallback = () => IntentionalAny;

type testArrayEmittersCallback = { ( array: ObservableArray<unknown> ): void };

QUnit.test( 'Hello', assert => {

  assert.ok( 'first test' );

  const run = ( name: string, command: runCallback ) => {
    console.log( `START: ${name}` );
    const result = command();
    console.log( `END: ${name}\n\n` );
    return result;
  };

  const observableArray = run( 'create', () => createObservableArray( {
    elements: [ 'a', 'bc' ]
  } ) );

  assert.ok( Array.isArray( observableArray ), 'isArray check' );
  assert.ok( observableArray instanceof Array, 'instanceof check' ); // eslint-disable-line no-instanceof-array

  run( 'push hello', () => observableArray.push( 'hello' ) );
  run( 'set element 0', () => { observableArray[ 0 ] = 'dinosaur'; } );
  run( 'set element 5', () => { observableArray[ 5 ] = 'hamburger'; } );
  run( 'length = 0', () => { observableArray.length = 0; } );
  run( 'a,b,c', () => {
    observableArray.push( 'a' );
    observableArray.push( 'b' );
    observableArray.push( 'c' );
  } );
  run( 'splice', () => observableArray.splice( 0, 1 ) );
} );

// Creates an array that is tested with the given modifiers against the expected results.
const testArrayEmitters = ( assert: Assert, modifier: testArrayEmittersCallback, expected: Array<unknown> ) => {
  const array = createObservableArray();
  const deltas: Array<unknown> = [];
  array.elementAddedEmitter.addListener( e => deltas.push( { type: 'added', value: e } ) );
  array.elementRemovedEmitter.addListener( e => deltas.push( { type: 'removed', value: e } ) );
  modifier( array );
  assert.deepEqual( deltas, expected );
};

QUnit.test( 'Test axon array length', assert => {

  const array = createObservableArray();
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
  array.length = 0;
  assert.equal( array.lengthProperty.value, 0, 'array lengthProperty test after setLengthAndNotify' );
  assert.equal( array.length, 0, 'array length test after setLengthAndNotify' );
} );

QUnit.test( 'Test delete', assert => {

  testArrayEmitters( assert, array => {

    array.push( 'test' );
    delete array[ 0 ];

    // FOR REVIEWER: The commented out code does not appear to have been testing anything. Expected does not include any
    // return value comparisons for array.hello. Should this be actually testing something or safe to delete?
    // array.hello = 'there';
    // delete array.hello;

    array[ -7 ] = 'time';
    delete array[ -7 ];
  }, [
    { type: 'added', value: 'test' },
    { type: 'removed', value: 'test' }
  ] );
} );

QUnit.test( 'Test same value', assert => {

  testArrayEmitters( assert, array => {

    array.push( 'test' );
    array.shuffle( new Random() );// eslint-disable-line bad-sim-text
  }, [
    { type: 'added', value: 'test' }
  ] );
} );

QUnit.test( 'Test axon array', assert => {

  testArrayEmitters( assert, array => {

    array.push( 'test' );
    array.push( 'test' );
    array.push( 'test' );
    array.push( 'test' );

    array.length = 1;

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

QUnit.test( 'Test axon array using Array.prototype.push.call etc', assert => {

  testArrayEmitters( assert, array => {

    array.push( 'test' );
    array.push( 'test' );
    array.push( 'test' );
    array.push( 'test' );

    array.length = 1;

    array.pop();
    array.push( 'hello' );
    Array.prototype.push.call( array, 'hello' );
    array.push( 'hello' );
    Array.prototype.push.apply( array, [ 'time' ] );
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

QUnit.test( 'Test axon array setLength', assert => {
  testArrayEmitters( assert, array => {
    array.push( 'hello' );
    array.length = 0;
    array.length = 4;
    array[ 12 ] = 'cheetah';
  }, [
    { type: 'added', value: 'hello' },
    { type: 'removed', value: 'hello' },
    { type: 'added', value: 'cheetah' }
  ] );
} );

QUnit.test( 'Test createObservableArray.push', assert => {
  testArrayEmitters( assert, array => {
    array.push( 'hello', 'there', 'old', undefined );
  }, [
    { type: 'added', value: 'hello' },
    { type: 'added', value: 'there' },
    { type: 'added', value: 'old' },
    { type: 'added', value: undefined }
  ] );
} );

QUnit.test( 'Test createObservableArray.pop', assert => {
  testArrayEmitters( assert, array => {
    array.push( 7 );
    const popped = array.pop();
    assert.equal( popped, 7 );
  }, [
    { type: 'added', value: 7 },
    { type: 'removed', value: 7 }
  ] );
} );

QUnit.test( 'Test createObservableArray.shift', assert => {
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

QUnit.test( 'Test createObservableArray.unshift', assert => {

  // From this example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
  testArrayEmitters( assert, array => {
    array.push( 'angel', 'clown', 'drum', 'sturgeon' );
    array.unshift( 'trumpet', 'dino' );

    assert.ok( array[ 0 ] === 'trumpet' );
  }, [
    { type: 'added', value: 'angel' },
    { type: 'added', value: 'clown' },
    { type: 'added', value: 'drum' },
    { type: 'added', value: 'sturgeon' },
    { type: 'added', value: 'trumpet' },
    { type: 'added', value: 'dino' }
  ] );
} );

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
QUnit.test( 'Test createObservableArray.copyWithin', assert => {
  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3, 4, 5 );
    array.copyWithin( -2, 0 ); // [1, 2, 3, 1, 2]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 5 },
    { type: 'removed', value: 4 },
    { type: 'removed', value: 5 },
    { type: 'added', value: 1 },
    { type: 'added', value: 2 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3, 4, 5 );
    array.copyWithin( 0, 3 ); //  [4, 5, 3, 4, 5]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 5 },
    { type: 'removed', value: 1 },
    { type: 'removed', value: 2 },
    { type: 'added', value: 4 },
    { type: 'added', value: 5 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3, 4, 5 );
    array.copyWithin( 0, 3, 4 ); //  [4, 2, 3, 4, 5]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 5 },
    { type: 'removed', value: 1 },
    { type: 'added', value: 4 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3, 4, 5 );
    array.copyWithin( -2, -3, -1 ); //   [1, 2, 3, 3, 4]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 5 },
    { type: 'removed', value: 5 },
    { type: 'added', value: 3 }
  ] );
} );

// Examples from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
QUnit.test( 'Test createObservableArray.fill', assert => {
  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4 ); // [4,4,4]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'removed', value: 1 },
    { type: 'removed', value: 2 },
    { type: 'removed', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 4 },
    { type: 'added', value: 4 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, 1 ); // [1,4,4]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'removed', value: 2 },
    { type: 'removed', value: 3 },
    { type: 'added', value: 4 },
    { type: 'added', value: 4 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, 1, 2 ); // [1,4,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'removed', value: 2 },
    { type: 'added', value: 4 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, 1, 1 ); // [1,2,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, 3, 3 ); // [1,2,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, -3, -2 ); // [4,2,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 },
    { type: 'removed', value: 1 },
    { type: 'added', value: 4 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, NaN, NaN ); // [1,2,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 }
  ] );

  testArrayEmitters( assert, array => {
    array.push( 1, 2, 3 );
    array.fill( 4, 3, 5 ); // [1,2,3]
  }, [
    { type: 'added', value: 1 },
    { type: 'added', value: 2 },
    { type: 'added', value: 3 }
  ] );
} );

QUnit.test( 'Test that length is correct in emitter callbacks after push', assert => {
  const a = createObservableArray();
  a.elementAddedEmitter.addListener( element => {
    assert.equal( a.length, 1 );
    assert.equal( a.lengthProperty.value, 1 );
    assert.equal( element, 'hello' );
  } );
  a.push( 'hello' );
} );

QUnit.test( 'Test return types', assert => {

  assert.ok( true );
  const a = createObservableArray();
  a.push( 'hello' );

  const x = a.slice();
  x.unshift( 7 );
  assert.ok( true, 'make sure it is safe to unshift on a sliced createObservableArray' );
} );

QUnit.test( 'Test constructor arguments', assert => {

  const a1 = createObservableArray( {
    length: 7
  } );
  assert.equal( a1.lengthProperty.value, 7, 'array length test' );
  a1.push( 'hello' );
  assert.equal( a1.lengthProperty.value, 8, 'array length test' );
  assert.equal( a1[ 7 ], 'hello', 'for push, element should be added at the end of the array' );

  const a2 = createObservableArray( {
    elements: [ 'hi', 'there' ]
  } );
  assert.equal( a2.length, 2, 'array length test' );
  assert.equal( a2[ 0 ], 'hi', 'first element correct' );
  assert.equal( a2[ 1 ], 'there', 'second element correct' );
  assert.equal( a2.length, 2, 'length correct' );

  let a3 = null;
  window.assert && assert.throws( () => {
    a3 = createObservableArray( { elements: [ 3 ], length: 1 } );
  }, 'length and elements are mutually exclusive' );
  assert.equal( a3, null, 'should not have been assigned' );

  // valid element types should succeed
  const a4 = createObservableArray( {
    elements: [ 'a', 'b' ],

    // @ts-expect-error, force set value type for testing
    valueType: 'string'
  } );
  assert.ok( !!a4, 'correct element types should succeed' );

  // invalid element types should fail
  window.assert && assert.throws( () => createObservableArray( {
    elements: [ 'a', 'b' ],

    // @ts-expect-error, force set value type for testing
    valueType: 'number'
  } ), 'should fail for invalid element types' );

} );

QUnit.test( 'Test function values', assert => {
  const array: Array<() => void> = createObservableArray();
  let number = 7;
  array.push( () => {
    number++;
  } );
  array[ 0 ]();
  assert.equal( 8, number, 'array should support function values' );
} );

QUnit.test( 'createObservableArrayTests misc', assert => {
  const array = createObservableArray();
  assert.ok( Array.isArray( array ), 'should be an array' );
} );