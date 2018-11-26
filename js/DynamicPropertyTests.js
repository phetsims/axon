// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for DynamicProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var DynamicProperty = require( 'AXON/DynamicProperty' );
  var Property = require( 'AXON/Property' );

  QUnit.module( 'DynamicProperty' );

  QUnit.test( 'Basics', function( assert ) {
    var aProperty = new Property( 5 ); // eslint-disable-line no-undef
    var bProperty = new Property( 2 ); // eslint-disable-line no-undef
    var propertyProperty = new Property( aProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new DynamicProperty( propertyProperty ); // eslint-disable-line no-undef

    assert.equal( dynamicProperty.value, aProperty.value );

    propertyProperty.value = bProperty;
    assert.equal( dynamicProperty.value, bProperty.value );

    bProperty.value = 7;
    assert.equal( dynamicProperty.value, bProperty.value );

    aProperty.value = 10;
    propertyProperty.value = aProperty;
    assert.equal( dynamicProperty.value, aProperty.value );
  } );

  QUnit.test( 'Derive (string)', function( assert ) {
    var a = {
      property: new Property( 5 ) // eslint-disable-line no-undef
    };
    var b = {
      property: new Property( 2 ) // eslint-disable-line no-undef
    };
    var mainProperty = new Property( a ); // eslint-disable-line no-undef
    var dynamicProperty = new DynamicProperty( mainProperty, { // eslint-disable-line no-undef
      derive: 'property'
    } );

    assert.equal( dynamicProperty.value, a.property.value );

    mainProperty.value = b;
    assert.equal( dynamicProperty.value, b.property.value );

    b.property.value = 7;
    assert.equal( dynamicProperty.value, b.property.value );

    a.property.value = 10;
    mainProperty.value = a;
    assert.equal( dynamicProperty.value, a.property.value );
  } );

  QUnit.test( 'Derive (function)', function( assert ) {
    var a = {
      property: new Property( 5 ) // eslint-disable-line no-undef
    };
    var b = {
      property: new Property( 2 ) // eslint-disable-line no-undef
    };
    var mainProperty = new Property( a ); // eslint-disable-line no-undef
    var dynamicProperty = new DynamicProperty( mainProperty, { // eslint-disable-line no-undef
      derive: function( ob ) {
        return ob.property;
      }
    } );

    assert.equal( dynamicProperty.value, a.property.value );

    mainProperty.value = b;
    assert.equal( dynamicProperty.value, b.property.value );

    b.property.value = 7;
    assert.equal( dynamicProperty.value, b.property.value );

    a.property.value = 10;
    mainProperty.value = a;
    assert.equal( dynamicProperty.value, a.property.value );
  } );

  QUnit.test( 'Bidirectional', function( assert ) {
    var firstProperty = new Property( 5 ); // eslint-disable-line no-undef
    var secondProperty = new Property( 10 ); // eslint-disable-line no-undef
    var numberPropertyProperty = new Property( firstProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new DynamicProperty( numberPropertyProperty, { bidirectional: true } ); // eslint-disable-line no-undef

    dynamicProperty.value = 2; // allowed now that it is bidrectional, otherwise prohibited
    assert.equal( firstProperty.value, 2 );

    numberPropertyProperty.value = secondProperty; // change which property is active
    assert.equal( dynamicProperty.value, 10 );

    dynamicProperty.value = 0;
    assert.equal( secondProperty.value, 0 );
    assert.equal( firstProperty.value, 2 );
  } );

  QUnit.test( 'Mapping (with bidirectional)', function( assert ) {
    var firstProperty = new Property( 5 ); // eslint-disable-line no-undef
    var secondProperty = new Property( 10 ); // eslint-disable-line no-undef
    var numberPropertyProperty = new Property( firstProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new DynamicProperty( numberPropertyProperty, { // eslint-disable-line no-undef
      bidirectional: true,
      map: function( number ) {
        return '' + number;
      },
      inverseMap: function( string ) {
        return Number.parseFloat( string );
      }
    } );

    assert.equal( typeof dynamicProperty.value, 'string' );
    assert.equal( dynamicProperty.value, '5' );

    dynamicProperty.value = '2';
    assert.equal( firstProperty.value, 2 );

    numberPropertyProperty.value = secondProperty; // change which property is active
    assert.equal( dynamicProperty.value, '10' );

    dynamicProperty.value = '0';
    assert.equal( secondProperty.value, 0 );
    assert.equal( firstProperty.value, 2 );
  } );

  QUnit.test( 'Attempted setters to nonbidrectional', function( assert ) {
    var property = new Property( 5 );
    var propertyProperty = new Property( property );
    var dynamicProperty = new DynamicProperty( propertyProperty );

    window.assert && assert.throws( function() {
      dynamicProperty.value = 10;
    }, /bidirectional/, 'Should not be able to set a non-bidrectional DynamicProperty' );

    window.assert && assert.throws( function() {
      dynamicProperty.reset();
    }, /bidirectional/, 'Should not be able to reset a non-bidrectional DynamicProperty' );

    assert.expect( window.assert ? 2 : 0 );
  } );

  QUnit.test( 'Bidirectional prevention of pingponging', function( assert ) {
    var callbackCount = 0;

    var sourceProperty = new Property( 0 );
    sourceProperty.link( function() {
      if ( callbackCount++ > 500 ) {
        throw new Error( 'Infinite loop detected' );
      }
    } );

    var wrapperProperty = new Property( sourceProperty );
    var dynamicProperty = new DynamicProperty( wrapperProperty, {
      bidirectional: true,
      // NOT a true inverse
      map: n => n + 2,
      inverseMap: n => n - 1
    } );
    dynamicProperty.link( function() {
      if ( callbackCount++ > 500 ) {
        throw new Error( 'Infinite loop detected' );
      }
    } );
    assert.equal( sourceProperty.value, 0 );
    assert.equal( dynamicProperty.value, 2 );

    dynamicProperty.value = 3;
    assert.equal( sourceProperty.value, 2 );
    assert.equal( dynamicProperty.value, 3 );

    sourceProperty.value = 5;
    assert.equal( sourceProperty.value, 5 );
    assert.equal( dynamicProperty.value, 7 );

    dynamicProperty.value = -10;
    assert.equal( sourceProperty.value, -11 );
    assert.equal( dynamicProperty.value, -10 );

    sourceProperty.value = 12;
    assert.equal( sourceProperty.value, 12 );
    assert.equal( dynamicProperty.value, 14 );
  } );
} );
