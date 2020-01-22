// Copyright 2017-2019, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Property = require( 'AXON/Property' );
  const Range = require( 'DOT/Range' );

  QUnit.module( 'NumberProperty' );

  QUnit.test( 'Test NumberProperty', assert => {

    let p = null;

    // valueType
    window.assert && assert.throws( () => {
      p = new NumberProperty( 'foo' );
    }, 'initial value has invalid valueType' );
    p = new NumberProperty( 0 );
    p.value = 1;
    window.assert && assert.throws( () => {
      p.value = 'foo';
    }, 'set value has invalid valueType' );

    // numberType
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, { numberType: 0 } );
    }, 'bad numberType' );
    p = new NumberProperty( 0, { numberType: 'FloatingPoint' } );
    p.value = 1;
    p.value = 1.2;
    window.assert && assert.throws( () => {
      p = new NumberProperty( 1.2, { numberType: 'Integer' } );
    }, 'initial value has invalid numberType' );
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, {
        numberType: 'Integer',
        validValues: [ 0, 1, 1.2, 2 ]
      } );
    }, 'member of validValues has invalid numberType' );
    p = new NumberProperty( 0, { numberType: 'Integer' } );
    p.value = 1;
    window.assert && assert.throws( () => {
      p.value = 1.2;
    }, 'set value has invalid numberType' );

    // range
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, { range: [ 0, 10 ] } );
    }, 'bad range' );
    window.assert && assert.throws( () => {
      p = new NumberProperty( 11, { range: new Range( 0, 10 ) } );
    }, 'initial value is greater than range.max' );
    window.assert && assert.throws( () => {
      p = new NumberProperty( -1, { range: new Range( 0, 10 ) } );
    }, 'initial value is less than range.min' );
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, {
        range: new Range( 0, 10 ),
        validValues: [ 0, 1, 2, 11 ]
      } );
    }, 'member of validValues is greater than range.max' );
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, {
        range: new Range( 0, 10 ),
        validValues: [ -1, 0, 1, 2 ]
      } );
    }, 'member of validValues is less than range.min' );
    p = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
    p.value = 5;
    window.assert && assert.throws( () => {
      p.value = 11;
    }, 'set value is greater than range.max' );
    window.assert && assert.throws( () => {
      p.value = -1;
    }, 'set value is less than range.min' );

    // units
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, { units: 'elephants' } );
    }, 'bad units' );


    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, { phetioType: NumberIO } );
    }, 'EnumerationProperty sets phetioType' );
  } );


  QUnit.test( 'Test NumberProperty range option as Property', function( assert ) {

    let rangeProperty = new Property( new Range( 0, 1 ) );
    let p = null;

    // valueType
    window.assert && assert.throws( () => {
      p = new NumberProperty( 0, { range: 'hi' } );
    }, 'incorrect range type' );
    p = new NumberProperty( 0, { range: rangeProperty } );
    assert.ok( p.rangeProperty === rangeProperty, 'rangeProperty should be set' );
    assert.ok( p.range === rangeProperty.value, 'rangeProperty value should be set NumberProperty.set on construction' );
    p.value = 1;
    p.value = 0;
    p.value = .5;
    window.assert && assert.throws( () => {
      p.value = 2;
    }, 'larger than range' );
    window.assert && assert.throws( () => {
      p.value = -2;
    }, 'smaller than range' );
    window.assert && assert.throws( () => {
      rangeProperty.value = new Range( 5, 10 );
    }, 'current value outside of range' );

    // reset from previous test setting to [5,10]
    p.dispose();
    rangeProperty.dispose();
    rangeProperty = new Property( new Range( 0, 1 ) );
    p = new NumberProperty( 0, { range: rangeProperty } );
    rangeProperty.value = new Range( 0, 10 );
    p.value = 2;


    p.setValueAndRange( 100, new Range( 99, 101 ) );

    const myRange = new Range( 5, 10 );
    p.setValueAndRange( 6, myRange );

    // TODO: this should work, but doesn't, and should be fixed by https://github.com/phetsims/axon/issues/277
    // assert.ok( myRange === p.rangeProperty.value, 'reference should be kept' );
  } );
} );