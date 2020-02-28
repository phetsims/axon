// Copyright 2017-2020, University of Colorado Boulder

/**
 * QUnit tests for ObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import ObservableArray from './ObservableArray.js';

QUnit.module( 'Observable Array' );

QUnit.test( 'Test observable array', function( assert ) {
  const array = new ObservableArray();
  array.push( 'a' );
  array.push( 'b' );
  array.push( 'c' );
  const dChecker = function( item ) {
    assert.equal( item, 'd' );
  };
  array.addItemAddedListener( dChecker );
  array.add( 'd' );

  array.removeItemAddedListener( dChecker );
  array.reset();
  assert.equal( array.length, 0 );

  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
  const myFish = [ 'angel', 'clown', 'mandarin', 'surgeon' ];
  const myFish2 = new ObservableArray();
  myFish2.push( 'angel' );
  myFish2.push( 'clown' );
  myFish2.push( 'mandarin' );
  myFish2.push( 'surgeon' );
  let addedCount = 0;
  let removedCount = 0;
  const addedOrder = [ 'drum', 'trumpet', 'parrot', 'anemone', 'blue' ];
  const removedOrder = [ 'mandarin', 'drum', 'angel', 'clown', 'blue', 'trumpet' ];
  myFish2.addItemAddedListener( function( item ) {
    assert.equal( item, addedOrder[ addedCount ], 'wrong item added' );
    addedCount++;
  } );
  myFish2.addItemRemovedListener( function( item ) {
    assert.equal( item, removedOrder[ removedCount ], 'wrong item removed' );
    removedCount++;
  } );

  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match to start' );

  // removes 0 elements from index 2, and inserts 'drum'
  let removed = myFish.splice( 2, 0, 'drum' );
  let removed2 = myFish2.splice( 2, 0, 'drum' );
  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
  assert.deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'drum', 'mandarin', 'surgeon']
// removed is [], no elements removed

// myFish is ['angel', 'clown', 'drum', 'mandarin', 'surgeon']
// removes 1 element from index 3
  removed = myFish.splice( 3, 1 );
  removed2 = myFish2.splice( 3, 1 );
  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
  assert.deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'drum', 'surgeon']
// removed is ['mandarin']

// myFish is ['angel', 'clown', 'drum', 'surgeon']
// removes 1 element from index 2, and inserts 'trumpet'
  removed = myFish.splice( 2, 1, 'trumpet' );
  removed2 = myFish2.splice( 2, 1, 'trumpet' );
  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
  assert.deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'trumpet', 'surgeon']
// removed is ['drum']

// myFish is ['angel', 'clown', 'trumpet', 'surgeon']
// removes 2 elements from index 0, and inserts 'parrot', 'anemone' and 'blue'
  removed = myFish.splice( 0, 2, 'parrot', 'anemone', 'blue' );
  removed2 = myFish2.splice( 0, 2, 'parrot', 'anemone', 'blue' );
  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
  assert.deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['parrot', 'anemone', 'blue', 'trumpet', 'surgeon']
// removed is ['angel', 'clown']

// myFish is ['parrot', 'anemone', 'blue', 'trumpet', 'surgeon']
// removes 2 elements from index 2
  removed = myFish.splice( myFish.length - 3, 2 );
  removed2 = myFish2.splice( myFish2.length - 3, 2 );
  assert.deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
  assert.deepEqual( removed, removed2, 'removed should be equal' );

// myFish is ['parrot', 'anemone', 'surgeon']
// removed is ['blue', 'trumpet']

} );