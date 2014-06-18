(function() {
  module( 'Axon: Simple Tests' );
  var Property = axon.Property;
  var DerivedProperty = axon.DerivedProperty;
  var ObservableArray = axon.ObservableArray;
  var log = axon.log;
  var PropertySet = axon.PropertySet;

  test( 'Simple tests', function() {

    var person = new axon.PropertySet( {name: 'larry', age: '100'} );
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
    person.multilink( ['name', 'age'], function( name, age ) {
      myValue = name + '/' + age;
    } );
    person.name = '123';
    person.age = 456;
    equal( myValue, '123/456', 'multilink should get both values' );
  } );

  test( 'Test once', function() {
    var count = 0;
    var p = new Property( 1 );
    p.once( function( newVal, oldVal ) {
      count++;
    } );

    p.value = 2;
    p.value = 3;
    p.value = 4;
    equal( count, 1, 'Listener added with once is only called back one time' );
  } );

  test( 'Test observable array', function() {
    var array = new ObservableArray( ['a', 'b', 'c'] );
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
  } );

  test( 'Test events', function() {
    var person = new axon.PropertySet( {name: 'larry', age: '100'} );
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
    var listener = function() {
      x = 999;
    };
    var handle = person.once( 'say-hello', listener );
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
    equal( p._observers.length, 3, 'should have 3 observers now' );
    p.unlink( b );
    equal( p._observers[0], a, 'should have removed b' );
    equal( p._observers[1], c, 'should have removed b' );
    equal( p._observers.length, 2, 'should have removed an item' );
  } );

  test( 'Test stale values in DerivedProperty', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var c = new DerivedProperty( [a, b], function( a, b ) {return a + b;} );
    a.value = 7;
    equal( c.value, 9 );
  } );

  test( 'Test Property.multilink', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var callbacks = 0;
    Property.multilink( [a, b], function( a, b ) {
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
    Property.lazyMultilink( [a, b], function( a, b ) {
      callbacks++;
      equal( a, 1 );
      equal( b, 2 );
    } );
    equal( callbacks, 0, 'shouldnt call back to a lazy multilink' );
  } );
})();
