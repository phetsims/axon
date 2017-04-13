// Copyright 2016, University of Colorado Boulder

(function() {
  'use strict';

  // Patches for globals, to satisfy the linter
  if ( window.axon ) {
    var axon = window.axon;
  }
  if ( window.deepEqual ) {
    var deepEqual = window.deepEqual;
  }
  module( 'Axon: Simple Tests' );
  var Property = axon.Property;
  var DerivedProperty = axon.DerivedProperty;
  var ObservableArray = axon.ObservableArray;
  var BooleanProperty = axon.BooleanProperty;
  var PropertySet = axon.PropertySet;

  /* eslint-disable no-undef */

  test( 'Simple tests', function() {

    var person = new axon.PropertySet( { name: 'larry', age: '100' } );
    equal( person.name, 'larry', 'name should be larry and accessible through es5 get' );

    person.name = 'susan';
    equal( person.name, 'susan', 'name should be susan after es5 set' );

    var ageLinkCalls = 0;
    person.ageProperty.link( function( age ) {ageLinkCalls++;} );
    person.age = person.age + 1;
    person.age = person.age + 2;
    person.age = person.age + 3;
    equal( ageLinkCalls, 4, 'should have received one call for each set, plus one on link' );

    person.reset();
    equal( person.name, 'larry', 'should have reset to the initial name' );

    var myValue = '';
    person.multilink( [ 'name', 'age' ], function( name, age ) {
      myValue = name + '/' + age;
    } );
    person.name = '123';
    person.age = 456;
    equal( myValue, '123/456', 'multilink should get both values' );
  } );

  test( 'Test once', function() {
    var count = 0;
    var p = new axon.Property( 1 );
    p.once( function( newVal, oldVal ) {
      count++;
    } );

    p.value = 2;
    p.value = 3;
    p.value = 4;
    equal( count, 1, 'Listener added with once is only called back one time' );
  } );

  test( 'Test observable array', function() {
    var array = new ObservableArray( [ 'a', 'b', 'c' ] );
    var dChecker = function( item ) {
      equal( item, 'd' );
    };
    array.addItemAddedListener( dChecker );
    array.add( 'd' );

    array.removeItemAddedListener( dChecker );
    array.reset();
    equal( array.get( 0 ), 'a' );
    equal( array.get( 1 ), 'b' );
    equal( array.get( 2 ), 'c' );
    equal( array.length, 3 );

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    var myFish = [ 'angel', 'clown', 'mandarin', 'surgeon' ];
    var myFish2 = new ObservableArray( [ 'angel', 'clown', 'mandarin', 'surgeon' ] );
    var addedCount = 0;
    var removedCount = 0;
    var addedOrder = [ 'drum', 'trumpet', 'parrot', 'anemone', 'blue' ];
    var removedOrder = [ 'mandarin', 'drum', 'angel', 'clown', 'blue', 'trumpet' ];
    myFish2.addItemAddedListener( function( item ) {
      equal( item, addedOrder[ addedCount ], 'wrong item added' );
      addedCount++;
    } );
    myFish2.addItemRemovedListener( function( item ) {
      equal( item, removedOrder[ removedCount ], 'wrong item removed' );
      removedCount++;
    } );

    deepEqual( myFish, myFish2.getArray(), 'arrays should match to start' );

    // removes 0 elements from index 2, and inserts 'drum'
    var removed = myFish.splice( 2, 0, 'drum' );
    var removed2 = myFish2.splice( 2, 0, 'drum' );
    deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
    deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'drum', 'mandarin', 'surgeon']
// removed is [], no elements removed

// myFish is ['angel', 'clown', 'drum', 'mandarin', 'surgeon']
// removes 1 element from index 3
    removed = myFish.splice( 3, 1 );
    removed2 = myFish2.splice( 3, 1 );
    deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
    deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'drum', 'surgeon']
// removed is ['mandarin']

// myFish is ['angel', 'clown', 'drum', 'surgeon']
// removes 1 element from index 2, and inserts 'trumpet'
    removed = myFish.splice( 2, 1, 'trumpet' );
    removed2 = myFish2.splice( 2, 1, 'trumpet' );
    deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
    deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['angel', 'clown', 'trumpet', 'surgeon']
// removed is ['drum']

// myFish is ['angel', 'clown', 'trumpet', 'surgeon']
// removes 2 elements from index 0, and inserts 'parrot', 'anemone' and 'blue'
    removed = myFish.splice( 0, 2, 'parrot', 'anemone', 'blue' );
    removed2 = myFish2.splice( 0, 2, 'parrot', 'anemone', 'blue' );
    deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
    deepEqual( removed, removed2, 'removed should be equal' );
// myFish is ['parrot', 'anemone', 'blue', 'trumpet', 'surgeon']
// removed is ['angel', 'clown']

// myFish is ['parrot', 'anemone', 'blue', 'trumpet', 'surgeon']
// removes 2 elements from index 2
    removed = myFish.splice( myFish.length - 3, 2 );
    removed2 = myFish2.splice( myFish2.length - 3, 2 );
    deepEqual( myFish, myFish2.getArray(), 'arrays should match' );
    deepEqual( removed, removed2, 'removed should be equal' );

// myFish is ['parrot', 'anemone', 'surgeon']
// removed is ['blue', 'trumpet']

  } );

  test( 'Test events', function() {
    var person = new axon.PropertySet( { name: 'larry', age: '100' } );
    var count = 0;
    var listener = function( person ) {
      count = count + 1;
    };
    person.on( 'reset-all', listener );

    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );

    equal( count, 3, 'Trigger calls on' );

    //Unregister the listener
    person.off( 'reset-all', listener );

    //Triggering more events shouldn't call back because we have removed the listener
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );

    equal( count, 3, 'Triggering more events should not call back because we have removed the listener' );

    var planetName = '?';
    var planetRadius = '?';
    person.on( 'planet-discovered', function( name, radius ) {
      planetName = name;
      planetRadius = radius;
    } );

    person.trigger( 'planet-discovered', 'pluto', 12345 );

    equal( planetName, 'pluto', 'argument should pass through event' );
    equal( planetRadius, 12345, 'argument should pass through event' );

    var name = person.name;
    person.once( 'name-changed', function( newName ) {
      name = newName;
    } );

    person.trigger( 'name-changed', 'Alice' );
    person.trigger( 'name-changed', 'Bob' );
    person.trigger( 'name-changed', 'Charlie' );

    equal( name, 'Alice', 'function added with once should only be called once' );

    var x = 0;
    var listener2 = function() {
      x = 999;
    };
    var handle = person.once( 'say-hello', listener2 );
    person.off( 'say-hello', handle );
    person.trigger( 'say-hello' );
    equal( x, 0, 'Function added with once should be removable' );
  } );

  test( 'Test unlink', function() {
    var p = new Property( 1 );
    var a = function( a ) {};
    var b = function( b ) {};
    var c = function( c ) {};
    p.link( a );
    p.link( b );
    p.link( c );
    equal( p.changedEmitter.listeners.length, 3, 'should have 3 observers now' );
    p.unlink( b );
    equal( p.changedEmitter.listeners[ 0 ], a, 'should have removed b' );
    equal( p.changedEmitter.listeners[ 1 ], c, 'should have removed b' );
    equal( p.changedEmitter.listeners.length, 2, 'should have removed an item' );
  } );

  test( 'Test stale values in DerivedProperty', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var c = new DerivedProperty( [ a, b ], function( a, b ) {return a + b;} );
    a.value = 7;
    equal( c.value, 9 );
  } );

  test( 'Test Property.multilink', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var callbacks = 0;
    Property.multilink( [ a, b ], function( a, b ) {
      callbacks++;
      equal( a, 1, 'first value should pass through' );
      equal( b, 2, 'second value should pass through' );
    } );
    equal( callbacks, 1, 'should have called back to a multilink' );
  } );

  test( 'Test Property.lazyMultilink', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var callbacks = 0;
    Property.lazyMultilink( [ a, b ], function( a, b ) {
      callbacks++;
      equal( a, 1 );
      equal( b, 2 );
    } );
    equal( callbacks, 0, 'shouldnt call back to a lazy multilink' );
  } );

  test( 'Test DerivedProperty.unlink', function() {

    var widthProperty = new Property( 2 );
    var heightProperty = new Property( 3 );
    var areaProperty = new DerivedProperty( [ widthProperty, heightProperty ],
      function( width, height ) { return width * height; } );
    var listener = function( area ) { /*console.log( 'area = ' + area );*/ };
    areaProperty.link( listener );

    equal( widthProperty.changedEmitter.listeners.length, 1 );
    equal( heightProperty.changedEmitter.listeners.length, 1 );
    equal( areaProperty.dependencies.length, 2 );
    equal( areaProperty.dependencyListeners.length, 2 );

    // Unlink the listener
    areaProperty.unlink( listener );
    areaProperty.dispose();

    equal( widthProperty.changedEmitter.listeners.length, 0 );
    equal( heightProperty.changedEmitter.listeners.length, 0 );
    equal( heightProperty.changedEmitter.listeners.length, 0 );

    equal( areaProperty.dependencies, null );
    equal( areaProperty.dependencyListeners, null );
    equal( areaProperty.dependencyValues, null );

  } );


  /**
   * Make sure linking attributes and unlinking attributes works on Property
   */
  test( 'Property.linkAttribute', function() {
    var property = new axon.Property( 7 );
    var state = { age: 99 };
    var listener = property.linkAttribute( state, 'age' );
    equal( state.age, 7, 'link should synchronize values' );
    property.value = 8;
    equal( state.age, 8, 'link should update values' );
    property.unlinkAttribute( listener );
    property.value = 9;
    equal( state.age, 8, 'state shouldnt have changed after unlink' );
  } );

  /**
   * Make sure linking attributes and unlinking attributes works on PropertySet
   */
  test( 'PropertySet.linkAttribute', function() {
    var propertySet = new axon.PropertySet( { time: 7 } );
    var state = { age: 99 };
    var listener = propertySet.linkAttribute( 'time', state, 'age' );
    equal( state.age, 7, 'link should synchronize values' );
    propertySet.time = 8;
    equal( state.age, 8, 'link should update values' );
    propertySet.unlinkAttribute( 'time', listener );
    propertySet.time = 9;
    equal( state.age, 8, 'state shouldnt have changed after unlink' );
  } );

  test( 'DerivedProperty.valueEquals', function() {
    var propA = new axon.Property( 'a' );
    var propB = new axon.Property( 'b' );
    var prop = axon.DerivedProperty.valueEquals( propA, propB );
    equal( prop.value, false );
    propA.value = 'b';
    equal( prop.value, true );
  } );

  test( 'DerivedProperty and/or', function() {
    var propA = new axon.Property( true );
    var propB = new axon.Property( false );
    var propC = new axon.Property( true );

    var and = axon.DerivedProperty.and( [ propA, propB, propC ] );
    var or = axon.DerivedProperty.or( [ propA, propB, propC ] );

    equal( and.value, false );
    equal( or.value, true );

    propB.value = true;
    equal( and.value, true );
    equal( or.value, true );

    propA.value = false;
    propB.value = false;
    propC.value = false;

    equal( and.value, false );
    equal( or.value, false );

    equal( axon.DerivedProperty.and( [] ).value, true );
    equal( axon.DerivedProperty.or( [] ).value, false );
  } );

  test( 'BooleanProperty', function() {
    window.assert && throws( function() {new BooleanProperty( 'hello' );}, 'invalid initial value for BooleanProperty' ); // eslint-disable-line
    var c = new BooleanProperty( true );
    c.set( true );
    c.set( false );
    c.set( true );
    window.assert && throws( function() {
      c.set( 123 );
    }, 'set an invalid value for BooleanProperty' );

    if ( !window.assert ) {
      expect( 0 );
    }
  } );

  test( 'Property value validation', function() {

    var property;
    window.assert && throws( function() {
      new phet.axon.Property( 0, { validValues: [ 1, 2, 3 ] } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.validValues' );
    property = new axon.Property( 1, { validValues: [ 1, 2, 3 ] } );
    property.set( 3 );
    window.assert && throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.validValues' );

    window.assert && throws( function() {
      new axon.Property( 0, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.isValidValue' );

    property = new axon.Property( 1, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } );
    property.set( 3 );
    window.assert && throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.isValidValue' );

    if ( !window.assert ) {
      expect( 0 );
    }
  } );

  test( 'Alternative PropertySet interface', function() {
    var p = new PropertySet( null, {
      name: {
        value: 'Larry'
      },
      age: {
        value: 123,
        validValues: [ 100, 123, 199 ]
      }
    } );

    console.log( p.name );
    equal( p.name, 'Larry', 'Name should match' );
  } );

  /* eslint-enable */
})();
