// Copyright 2017-2018, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Validator = require( 'AXON/Validator' );

  QUnit.module( 'Validator' );

  // Note that many validation tests are in PropertyTests
  QUnit.test( 'Test Validator', function( assert ) {
    assert.ok( true, 'so we have at least 1 test in this set' );

    assert.ok( Validator.validate( 3, { validValues: [ 1, 2, 3 ] } ) );

    window.assert && assert.throws( function() {
      assert.ok( !Validator.validate( 4, { validValues: [ 1, 2, 3 ] } ) );
    }, 'should throw assertion error' );
  } );
} );