// Copyright 2016, University of Colorado Boulder

(function() {
  'use strict';

  // Patches for globals, to satisfy the linter
  if ( window.axon ) {
    var axon = window.axon;
  }
  module( 'Axon: Simple Tests' );
  var Property = axon.Property;
  var DerivedProperty = axon.DerivedProperty;
  var BooleanProperty = axon.BooleanProperty;

  /* eslint-disable no-undef */

  test( 'Test stale values in DerivedProperty', function() {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var c = new DerivedProperty( [ a, b ], function( a, b ) {return a + b;} );
    a.value = 7;
    equal( c.value, 9 );
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


  /* eslint-enable */
})();
