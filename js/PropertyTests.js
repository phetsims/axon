// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Property = require( 'AXON/Property' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var Tandem = require( 'TANDEM/Tandem' );

  // ifphetio
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );

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
    assert.equal( callbacks, 0, 'should not call back to a lazy multilink' );
  } );

  QUnit.test( 'Property ID checks', function( assert ) {
    assert.ok( new Property( 1 ).id !== new Property( 1 ).id, 'Properties should have unique IDs' );
  } );

  QUnit.test( 'Property link parameters', function( assert ) {
    var p = new Property( 1 );
    var calls = [];
    p.link( function( newValue, oldValue, property ) {
      calls.push( {
        newValue: newValue,
        oldValue: oldValue,
        property: property
      } );
    } );
    p.value = 2;

    assert.equal( calls.length, 2 );

    assert.equal( calls[ 0 ].newValue, 1 );
    assert.equal( calls[ 0 ].oldValue, undefined );
    assert.equal( calls[ 0 ].property, p );

    assert.equal( calls[ 1 ].newValue, 2 );
    assert.equal( calls[ 1 ].oldValue, 1 );
    assert.equal( calls[ 1 ].property, p );
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
    assert.equal( state.age, 8, 'state should not have changed after unlink' );
  } );

  QUnit.test( 'Property value validation', function( assert ) {

    // Type that is specific to valueType tests
    function TestType() {}

    var property = null;
    var options = {};

    // valueType is a primitive type (typeof validation)
    options = {
      valueType: 'string'
    };
    window.assert && assert.throws( function() {
      new Property( 0, { valueType: 'foo' } ); // eslint-disable-line
    }, 'options.valueType is invalid, expected a primitive data type' );
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'invalid initial value with options.valueType typeof validation' );
    property = new Property( 'horizontal', options );
    property.set( 'vertical' );
    window.assert && assert.throws( function() {
      property.set( 0 );
    }, 'invalid set value with options.valueType typeof validation' );

    // valueType is a constructor (instanceof validation)
    options = {
      valueType: TestType
    };
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'invalid initial value for options.valueType instanceof validation' );
    property = new Property( new TestType(), options );
    property.set( new TestType() );
    window.assert && assert.throws( function() {
      property.set( 0 );
    }, 'invalid set value with options.valueType instanceof validation' );

    // validValues
    options = {
      validValues: [ 1, 2, 3 ]
    };
    window.assert && assert.throws( function() {
      new Property( 0, { validValues: 0 } ); // eslint-disable-line
    }, 'options.validValues is invalid' );
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'invalid initial value with options.validValues' );
    property = new Property( 1, options );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'invalid set value with options.validValues' );

    // isValidValues
    options = {
      isValidValue: function( value ) {
        return ( value > 0 && value < 4 );
      }
    };
    window.assert && assert.throws( function() {
      new Property( 0, { isValidValue: 0 } ); // eslint-disable-line
    }, 'options.isValidValue is invalid' );
    window.assert && assert.throws( function() {
      new Property( 0, options ); // eslint-disable-line
    }, 'invalid initial value with options.isValidValue' );
    property = new Property( 1, options );
    property.set( 3 );
    window.assert && assert.throws( function() {
      property.set( 4 );
    }, 'invalid set value with options.isValidValue' );

    // Compatible combinations of validation options, possibly redundant (not exhaustive)
    options = {
      valueType: 'string',
      validValues: [ 'bob', 'joe', 'sam' ],
      isValidValue: function( value ) {
        return value.length === 3;
      }
    };
    property = new Property( 'bob', options );
    window.assert && assert.throws( function() {
      property.set( 0 );
    }, 'invalid set value with compatible combination of validation options' );
    window.assert && assert.throws( function() {
      property.set( 'ted' );
    }, 'invalid set value with compatible combination of validation options' );

    // Incompatible combinations of validation options (not exhaustive)
    // These tests will always fail on initialization, since the validation criteria are contradictory.
    options = {
      valueType: 'number',
      validValues: [ 'bob', 'joe', 'sam' ],
      isValidValue: function( value ) {
        return value.length === 4;
      }
    };
    window.assert && assert.throws( function() {
      property = new Property( 0, options );
    }, 'invalid initial value with incompatible combination of validation options' );
    window.assert && assert.throws( function() {
      property = new Property( 'bob', options );
    }, 'invalid initial value with incompatible combination of validation options' );
    window.assert && assert.throws( function() {
      property = new Property( 'fred', options );
    }, 'invalid initial value with incompatible combination of validation options' );

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