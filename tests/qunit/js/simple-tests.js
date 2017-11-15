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

  /* eslint-disable no-undef */

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
    var person = new axon.Events( { name: 'larry', age: '100' } );
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

  test( 'DerivedProperty.valueEquals', function() {
    var propA = new axon.Property( 'a' );
    var propB = new axon.Property( 'b' );
    var prop = axon.DerivedProperty.valueEquals( propA, propB );
    equal( prop.value, false );
    propA.value = 'b';
    equal( prop.value, true );
  } );

  test( 'DerivedProperty and/or', function() {

    var propA = new axon.Property( false );
    var propB = new axon.Property( false );
    var propC = new axon.Property( false );
    var propD = new axon.Property( 0 ); // dependency with an invalid (non-boolean) type

    // fail: 'and' with non-boolean Property
    window.assert && throws( function() { return axon.DerivedProperty.and( [ propA, propD ] ); },
      'DerivedProperty.and requires booleans Property values' );

    // fail: 'or' with non-boolean Property
    window.assert && throws( function() { return axon.DerivedProperty.or( [ propA, propD ] ); },
      'DerivedProperty.or requires booleans Property values' );

    // correct usages of 'and' and 'or'
    var and = axon.DerivedProperty.and( [ propA, propB, propC ] );
    var or = axon.DerivedProperty.or( [ propA, propB, propC ] );

    equal( and.value, false );
    equal( or.value, false );

    propA.value = true;
    equal( and.value, false );
    equal( or.value, true );

    propB.value = true;
    equal( and.value, false );
    equal( or.value, true );

    propC.value = true;
    equal( and.value, true );
    equal( or.value, true );

    // fail: setting a dependency to a non-boolean value
    window.assert && throws( function() { propA.value = 0; },
      'DerivedProperty dependency must have boolean value' );
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
      new axon.Property( 0, { validValues: [ 1, 2, 3 ] } ); // eslint-disable-line
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

  test( 'Test StringProperty', function() {

    var p = new axon.StringProperty( 'foo' );
    p.value = 'bar';

    // default validation
    window.assert && throws( function() {
      p.value = 0;
    }, 'should throw Assertion failed: invalid value: 0' );

    // validValues
    p = new axon.StringProperty( 'foo', {
      validValues: [ 'foo', 'bar' ]
    } );
    p.value = 'bar';
    window.assert && throws( function() {
      p.value = 'bad';
    }, 'should throw Assertion failed: invalid value: bad' );

    // isValidValue
    p = new axon.StringProperty( 'foo', {
      isValidValue: function( value ) { return value[ 0 ] === 'f'; } // beings with 'f'
    } );
    p.value = 'five';
    window.assert && throws( function() {
      p.value = 'bad';
    }, 'should throw Assertion failed: invalid value: bad' );

    // mutually exclusive options
    window.assert && throws( function() {
      p = new axon.StringProperty( 'foo', {
        validValues: [ 'foo', 'bar' ],
        isValidValue: function( value ) { return value[ 0 ] === 'f'; }
      } );
    }, 'should throw Assertion failed: validValues and isValidValue are mutually exclusive' );

    if ( !window.assert ) {
      expect( 0 );
    }
  } );

  test( 'Test NumberProperty', function() {

    var p = new axon.NumberProperty( 1 );
    p.value = 0;

    // default validation
    window.assert && throws( function() {
      p = new axon.NumberProperty( 'foo' );
    }, 'should throw Assertion failed: invalid initial value: foo' );
    p = new axon.NumberProperty( 0 );
    window.assert && throws( function() {
      p.value = 'bar';
    }, 'should throw Assertion failed: invalid initial value: bar' );

    // range
    p = new axon.NumberProperty( 0, {
      range: { min: 0, max: 10 }
    } );
    p.value = 5;
    window.assert && throws( function() {
      p.value = 11;
    }, 'should throw Assertion failed: invalid value: 11' );
    window.assert && throws( function() {
      p.value = -1;
    }, 'should throw Assertion failed: invalid value: -1' );

    // valueType
    p = new axon.NumberProperty( 0 );
    equal( p.valueType, 'FloatingPoint', 'default valueType should be FloatingPoint' );

    p = new axon.NumberProperty( 0, { valueType: 'Integer' } );
    equal( p.valueType, 'Integer', 'valueType should be integer when set as such.' );

    window.assert && throws( function() {
      p = new axon.NumberProperty( 0, { valueType: 'GarbaldyGOOK' } );
    }, 'should throw Assertion failed: invalid type: GarbaldyGOOK' );

    p = new axon.NumberProperty( 0, { valueType: 'Integer' } );

    window.assert && throws( function() {
      p.value = 3.4;
    }, 'should throw Assertion failed: invalid value: 3.4' );

    p.value = 3;
    equal( p.value, 3 );

    p = new axon.NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'Integer' } );
    window.assert && throws( function() {
      p.value = 3.4;
    }, 'should throw Assertion failed: invalid value: 3.4' );

    p = new axon.NumberProperty( 3.4, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
    window.assert && throws( function() {
      p = new axon.NumberProperty( 3.4, { range: { min: 0, max: 5 }, valueType: 'Integer' } );
    }, 'should throw Assertion failed: initial value 3.4 must be of type: Integer' );

    p = new axon.NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
    p.value = 3.4;
    equal( p.value, 3.4 );

    p = new axon.NumberProperty( 0, { validValues: [ 0, 1, 2, 3, 4, 5 ], valueType: 'Integer' } );
    window.assert && throws( function() {
      p = new axon.NumberProperty( 0, { validValues: [ 0, 1, 2, 3.4, 5 ], valueType: 'Integer' } );
    }, 'should throw Assertion failed: validValues must contain numbers of the right valueType' );

    p = new axon.NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
    p.value = 3.4;
    equal( p.value, 3.4 );

    // validValues
    p = new axon.NumberProperty( 0, {
      validValues: [ 0, 1, 2 ]
    } );
    p.value = 1;
    p.value = 2;
    window.assert && throws( function() {
      p.value = 3;
    }, 'should throw Assertion failed: invalid value: 3' );

    // isValidValue
    p = new axon.NumberProperty( 0, {
      isValidValue: function( value ) { return value >= 0; }
    } );
    p.value = 1;
    p.value = 0;
    window.assert && throws( function() {
      p.value = -1;
    }, 'should throw Assertion failed: invalid value: -1' );
    window.assert && throws( function() {
      p.value = 'foo';
    }, 'should throw Assertion failed: invalid value: foo' );

    // mutually-exclusive options
    window.assert && throws( function() {
      p = new axon.NumberProperty( 0, {
        range: { min: 0, max: 10 },
        isValidValue: function( value ) { return value >= 0; },
        validValues: [ 0, 1, 2 ]
      }, 'should throw Assertion failed: validValues, isValidValue and range are mutually-exclusive options' );
    } );

    if ( !window.assert ) {
      expect( 0 );
    }
  } );

  /* eslint-enable */
})();
