// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
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
    var property = new Property( 7 );
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

    // Type that is specific to valueType tests
    function TestType( index ) { this.index = index; }

    var property;
    window.assert && assert.throws( function() {
      new Property( 0, { validValues: [ 1, 2, 3 ] } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.validValues' );
    property = new Property( 1, { validValues: [ 1, 2, 3 ] } );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.validValues' );

    window.assert && assert.throws( function() {
      new Property( 0, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } ); // eslint-disable-line
    }, 'invalid initial value for Property with options.isValidValue' );

    property = new Property( 1, { isValidValue: function( value ) { return ( value > 0 && value < 4 ); } } );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'set an invalid value for Property with options.isValidValue' );

    // valueType by itself
    var options = { 
      valueType: TestType
    };
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'invalid value fails valueType validation for Property with options.valueType' );
    property = new Property( new TestType( 0 ), options );
    property.set( new TestType( 0 ) );
    window.assert && assert.throws( function() {
      property.set( 0 );
    }, 'set value fails valueType validation for Property with options.valueType' );

    // valueType and isValidValue combined
    options = {
      valueType: TestType,
      isValidValue: function( value ) {
        return value.index >= 0;
      }
    };
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'initial value fails valueType validation for Property with options.valueType and options.isValidValue' );
    window.assert && assert.throws( function() {
      new Property( new TestType( -1 ), options ); // eslint-disable-line
    }, 'initial value fails isValidValue validation for Property with options.valueType and options.isValidValue' );
    property = new Property( new TestType( 0 ), options );
    property.set( new TestType( 0 ) );
    window.assert && assert.throws( function() {
      property.set( 0 );
    }, 'set value fails valueType validation for Property with options.valueType and options.isValidValue' );
    window.assert && assert.throws( function() {
      property.set( new TestType( -1 ) );
    }, 'set value fails isValidValue validation for Property with options.valueType and options.isValidValue' );

    assert.ok( true, 'so we have at least 1 test in this set' );
  } );

  // Tests that can only run in phet-io mode
  if ( window.phet.phetio ) {
    QUnit.test( 'Test PropertyIO toStateObject/fromStateObject', function( assert ) {
      var done = assert.async();
      var tandem = Tandem.rootTandem.createTandem( 'testTandemProperty' );
      tandem.addInstance = function( instance, options ) {

        // Run in the next frame after the object finished getting constructed
        setTimeout( function() {
          var stateObject = ObjectIO.toStateObject( instance );
          assert.equal( stateObject.value, 0, 'toStateObject should match' );
          done();
        }, 0 );
      };
      new Property( 0, { // eslint-disable-line
        phetioType: PropertyIO( ObjectIO ),
        tandem: tandem,
        validValues: [ 0, 1, 2, 3 ]
      } );
    } );
  }
} );