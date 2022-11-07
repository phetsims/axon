// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit tests for DynamicProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import DynamicProperty from './DynamicProperty.js';
import Property from './Property.js';

QUnit.module( 'DynamicProperty' );

QUnit.test( 'Basics', assert => {
  const aProperty = new Property( 5 );
  const bProperty = new Property( 2 );
  const propertyProperty = new Property( aProperty );
  const dynamicProperty = new DynamicProperty( propertyProperty );

  assert.equal( dynamicProperty.value, aProperty.value );

  propertyProperty.value = bProperty;
  assert.equal( dynamicProperty.value, bProperty.value );

  bProperty.value = 7;
  assert.equal( dynamicProperty.value, bProperty.value );

  aProperty.value = 10;
  propertyProperty.value = aProperty;
  assert.equal( dynamicProperty.value, aProperty.value );
} );

QUnit.test( 'Derive (string)', assert => {
  const a = {
    property: new Property( 5 )
  };
  const b = {
    property: new Property( 2 )
  };
  const mainProperty = new Property( a );
  const dynamicProperty = new DynamicProperty( mainProperty, {
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

QUnit.test( 'Derive (function)', assert => {
  const a = {
    property: new Property( 5 )
  };
  const b = {
    property: new Property( 2 )
  };
  const mainProperty = new Property( a );
  const dynamicProperty = new DynamicProperty( mainProperty, {
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

QUnit.test( 'Bidirectional', assert => {
  const firstProperty = new Property( 5 );
  const secondProperty = new Property( 10 );
  const numberPropertyProperty = new Property( firstProperty );
  const dynamicProperty = new DynamicProperty( numberPropertyProperty, { bidirectional: true } );

  dynamicProperty.value = 2; // allowed now that it is bidirectional, otherwise prohibited
  assert.equal( firstProperty.value, 2 );

  numberPropertyProperty.value = secondProperty; // change which property is active
  assert.equal( dynamicProperty.value, 10 );

  dynamicProperty.value = 0;
  assert.equal( secondProperty.value, 0 );
  assert.equal( firstProperty.value, 2 );
} );

QUnit.test( 'Mapping (with bidirectional)', assert => {
  const firstProperty = new Property( 5 );
  const secondProperty = new Property( 10 );
  const numberPropertyProperty = new Property( firstProperty );
  const dynamicProperty = new DynamicProperty( numberPropertyProperty, {
    bidirectional: true,
    map: function( number ) {
      return `${number}`;
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

QUnit.test( 'Attempted setters to nonbidirectional', assert => {
  const property = new Property( 5 );
  const propertyProperty = new Property( property );
  const dynamicProperty = new DynamicProperty( propertyProperty );

  window.assert && assert.throws( () => {
    dynamicProperty.value = 10;
  }, /bidirectional/, 'Should not be able to set a non-bidirectional DynamicProperty' );

  window.assert && assert.throws( () => {
    dynamicProperty.reset();
  }, /bidirectional/, 'Should not be able to reset a non-bidirectional DynamicProperty' );

  assert.expect( window.assert ? 2 : 0 );
} );

QUnit.test( 'Bidirectional prevention of pingponging', assert => {
  let callbackCount = 0;

  const sourceProperty = new Property( 0 );
  sourceProperty.link( () => {
    if ( callbackCount++ > 500 ) {
      throw new Error( 'Infinite loop detected' );
    }
  } );

  const wrapperProperty = new Property( sourceProperty );
  const dynamicProperty = new DynamicProperty( wrapperProperty, {
    bidirectional: true,
    // NOT a true inverse
    map: ( n: number ) => n + 2,
    inverseMap: ( n: number ) => n - 1
  } );
  dynamicProperty.link( () => {
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
