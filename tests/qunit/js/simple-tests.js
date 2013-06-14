(function() {
  module( 'Axon' );
  var Property = axon.Property;
  var ObservableArray = axon.ObservableArray;
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
    array.addListener( function( added, removed ) {
      deepEqual( added, ['d'], 'A single item was added to the ObservableArray' );
      deepEqual( removed, [], 'Nothing removed' );
    } );
    array.add( 'd' );
  } );

  test( 'Test events', function() {
    var person = new axon.PropertySet( {name: 'larry', age: '100'} );
    var count = 0;
    var listener = function( person ) {
      console.log( "resetted all" );
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
})();