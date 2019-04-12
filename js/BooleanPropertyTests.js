// Copyright 2017-2018, University of Colorado Boulder

/**
 * QUnit Tests for BooleanProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  const BooleanIO = require( 'TANDEM/types/BooleanIO' );
  var BooleanProperty = require( 'AXON/BooleanProperty' );

  QUnit.module( 'BooleanProperty' );
  QUnit.test( 'BooleanProperty', function( assert ) {

    var p = null;

    // isValidValue
    window.assert && assert.throws( function() {
      p = new BooleanProperty( true, { valueType: 'boolean' } );
    }, 'valueType cannot be set by client' );

    // validValues
    window.assert && assert.throws( function() {
      p = new BooleanProperty( true, { validValues: [ true, false ] } );
    }, 'validValues cannot be set by client' );

    // isValidValue
    window.assert && assert.throws( function() {
      p = new BooleanProperty( true, { isValidValue: function( value ) { return typeof value === 'boolean'; } } );
    }, 'isValidValue cannot be set by client' );

    window.assert && assert.throws( function() {
      p = new BooleanProperty( 'hello' );
    }, 'invalid initial value' );

    p = new BooleanProperty( true );
    p.set( true );
    p.set( false );
    p.set( true );
    window.assert && assert.throws( function() {
      p.set( 123 );
    }, 'invalid set value' );

    window.assert && assert.throws( function() {
      p = new BooleanProperty( true, { phetioType: BooleanIO } );
    }, 'EnumerationProperty sets phetioType' );

    assert.ok( true, 'so we have at least 1 test in this set' );
  } );
} );