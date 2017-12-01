// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for ObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObservableArray = require( 'AXON/ObservableArray' );

  QUnit.module( 'Observable Array' );

  QUnit.test( 'Test observable array', function( assert ) {
    var array = new ObservableArray( [ 'a', 'b', 'c' ] );
    var dChecker = function( item ) {
      assert.equal( item, 'd' );
    };
    array.addItemAddedListener( dChecker );
    array.add( 'd' );

    array.removeItemAddedListener( dChecker );
    array.reset();
    assert.equal( array.get( 0 ), 'a' );
    assert.equal( array.get( 1 ), 'b' );
    assert.equal( array.get( 2 ), 'c' );
    assert.equal( array.length, 3 );

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    var myFish = [ 'angel', 'clown', 'mandarin', 'surgeon' ];
    var myFish2 = new ObservableArray( [ 'angel', 'clown', 'mandarin', 'surgeon' ] );
    var addedCount = 0;
    var removedCount = 0;
    var addedOrder = [ 'drum', 'trumpet', 'parrot', 'anemone', 'blue' ];
    var removedOrder = [ 'mandarin', 'drum', 'angel', 'clown', 'blue', 'trumpet' ];
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
    var removed = myFish.splice( 2, 0, 'drum' );
    var removed2 = myFish2.splice( 2, 0, 'drum' );
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
} );