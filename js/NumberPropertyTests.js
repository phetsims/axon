// Copyright 2017-2018, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var NumberIO = require( 'TANDEM/types/NumberIO' );
  var NumberProperty = require( 'AXON/NumberProperty' );
  var Range = require( 'DOT/Range' );

  QUnit.module( 'NumberProperty' );

  QUnit.test( 'Test NumberProperty', function( assert ) {

    var p = null;

    // valueType
    window.assert && assert.throws( function() {
      p = new NumberProperty( 'foo' );
    }, 'initial value has invalid valueType' );
    p = new NumberProperty( 0 );
    p.value = 1;
    window.assert && assert.throws( function() {
      p.value = 'foo';
    }, 'set value has invalid valueType' );

    // numberType
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, { numberType: 0 } );
    }, 'bad numberType' );
    p = new NumberProperty( 0, { numberType: 'FloatingPoint' } );
    p.value = 1;
    p.value = 1.2;
    window.assert && assert.throws( function() {
      p = new NumberProperty( 1.2, { numberType: 'Integer' } );
    }, 'initial value has invalid numberType' );
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, {
        numberType: 'Integer',
        validValues: [ 0, 1, 1.2, 2 ]
      } );
    }, 'member of validValues has invalid numberType' );
    p = new NumberProperty( 0, { numberType: 'Integer' } );
    p.value = 1;
    window.assert && assert.throws( function() {
      p.value = 1.2;
    }, 'set value has invalid numberType' );

    // range
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, { range: [ 0, 10 ] } );
    }, 'bad range' );
    window.assert && assert.throws( function() {
      p = new NumberProperty( 11, { range: new Range( 0, 10 ) } );
    }, 'initial value is greater than range.max' );
    window.assert && assert.throws( function() {
      p = new NumberProperty( -1, { range: new Range( 0, 10 ) } );
    }, 'initial value is less than range.min' );
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, {
        range: new Range( 0, 10 ),
        validValues: [ 0, 1, 2, 11 ]
      } );
    }, 'member of validValues is greater than range.max' );
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, {
        range: new Range( 0, 10 ),
        validValues: [ -1, 0, 1, 2 ]
      } );
    }, 'member of validValues is less than range.min' );
    p = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
    p.value = 5;
    window.assert && assert.throws( function() {
      p.value = 11;
    }, 'set value is greater than range.max' );
    window.assert && assert.throws( function() {
      p.value = -1;
    }, 'set value is less than range.min' );

    // units
    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, { units: 'elephants' } );
    }, 'bad units' );


    window.assert && assert.throws( function() {
      p = new NumberProperty( 0, { phetioType: NumberIO } );
    }, 'EnumerationProperty sets phetioType' );

    assert.ok( true, 'so we have at least 1 test in this set' );
  } );

} );