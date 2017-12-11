// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var Property = require( 'AXON/Property' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var Tandem = require( 'TANDEM/Tandem' );

  QUnit.module( 'Property' );

  QUnit.test( 'Test unlink', function( assert ) {
    var p = new Property( 1 );
    var a = function( a ) {};
    var b = function( b ) {};
    var c = function( c ) {};
    p.link( a );
    p.link( b );
    p.link( c );
    assert.equal( p.changedEmitter.listeners.length, 3, 'should have 3 observers now' );
    p.unlink( b );
    assert.equal( p.changedEmitter.listeners[ 0 ], a, 'should have removed b' );
    assert.equal( p.changedEmitter.listeners[ 1 ], c, 'should have removed b' );
    assert.equal( p.changedEmitter.listeners.length, 2, 'should have removed an item' );
  } );

  QUnit.test( 'Test Property.multilink', function( assert ) {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var callbacks = 0;
    Property.multilink( [ a, b ], function( a, b ) {
      callbacks++;
      assert.equal( a, 1, 'first value should pass through' );
      assert.equal( b, 2, 'second value should pass through' );
    } );
    assert.equal( callbacks, 1, 'should have called back to a multilink' );
  } );

  QUnit.test( 'Test Property.lazyMultilink', function( assert ) {
    var a = new Property( 1 );
    var b = new Property( 2 );
    var callbacks = 0;
    Property.lazyMultilink( [ a, b ], function( a, b ) {
      callbacks++;
      assert.equal( a, 1 );
      assert.equal( b, 2 );
    } );
    assert.equal( callbacks, 0, 'shouldnt call back to a lazy multilink' );
  } );

  /**
   * Make sure linking attributes and unlinking attributes works on Property
   */
  QUnit.test( 'Property.linkAttribute', function( assert ) {
    var property = new axon.Property( 7 );
    var state = { age: 99 };
    var listener = property.linkAttribute( state, 'age' );
    assert.equal( state.age, 7, 'link should synchronize values' );
    property.value = 8;
    assert.equal( state.age, 8, 'link should update values' );
    property.unlinkAttribute( listener );
    property.value = 9;
    assert.equal( state.age, 8, 'state shouldnt have changed after unlink' );
  } );

  QUnit.test( 'Property value validation', function( assert ) {

    var property;
    window.assert && assert.throws( function() {
      new axon.Property( 0, { validValues: [ 1, 2, 3 ] } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.validValues' );
    property = new axon.Property( 1, { validValues: [ 1, 2, 3 ] } );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.validValues' );

    window.assert && assert.throws( function() {
      new axon.Property( 0, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.isValidValue' );

    property = new axon.Property( 1, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.isValidValue' );

    assert.ok( true, 'so we have at least 1 test in this set' );
  } );

  // Tests that can only run in phet-io mode
  if ( window.phet.phetio ) {
    QUnit.test( 'Test PropertyIO toStateObject/fromStateObject', function( assert ) {
      var tandem = Tandem.rootTandem.createTandem( 'testTandem' );
      tandem.addInstance = function( instance, options ) {
        var stateObject = ObjectIO.toStateObject( instance );
        assert.equal( stateObject.value, 0, 'toStateObject should match' );
      };
      new Property( 0, { // eslint-disable-line
        phetioType: PropertyIO( ObjectIO ),
        tandem: tandem,
        validValues: [ 0, 1, 2, 3 ]
      } );
    } );
  }
} );