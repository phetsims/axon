// Copyright 2019, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const Enumeration = require( 'PHET_CORE/Enumeration' );
  const EnumerationIO = require( 'PHET_CORE/EnumerationIO' );
  const EnumerationProperty = require( 'AXON/EnumerationProperty' );

  QUnit.module( 'EnumerationProperty' );
  QUnit.test( 'EnumerationProperty', function( assert ) {

    const Birds = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
    let birdProperty = null;

    // constructor value
    assert.ok( () => {
      birdProperty = new EnumerationProperty( Birds.ROBIN );
    }, 'good constructor value' );
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( true );
    }, 'invalid constructor value' );

    // set value
    assert.ok( () => {
      birdProperty.set( Birds.JAY );
    }, 'good set value' );
    window.assert && assert.throws( function() {
      birdProperty.set( 5 );
    }, 'bad set value' );

    // superclass options that are not supported by EnumerationProperty
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { validValues: Birds.VALUES } );
    }, 'EnumerationProperty does not support validValues' );
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { isValidValue: () => true } );
    }, 'EnumerationProperty does not support isValidValue' );

    // superclass options that are controlled by EnumerationProperty
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { valueType: Birds } );
    }, 'EnumerationProperty sets valueType' );
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { phetioType: EnumerationIO } );
    }, 'EnumerationProperty sets phetioType' );
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( Birds, { phetioType: EnumerationIO } );
    }, 'Did not include initial value' );
    window.assert && assert.throws( function() {
      birdProperty = new EnumerationProperty( {} );
    }, 'That is not an enumeration' );

    assert.ok( true, 'so we have at least 1 test in this set' );
  } );
} );