// Copyright 2017-2019, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Validator = require( 'AXON/Validator' );

  QUnit.module( 'Validator' );

  // Note that many validation tests are in PropertyTests
  QUnit.test( 'Test Validator', assert => {

    assert.ok( Validator.validate( 3, { validValues: [ 1, 2, 3 ] } ) );
    assert.ok( Validator.validate( [], { valueType: Array } ) );
    window.assert && assert.throws( () => !Validator.validate( 4, { validValues: [ 1, 2, 3 ] } ), 'invalid number' );
    window.assert && assert.throws( () => !Validator.validate( 'hello', { valueType: Array } ), 'string isn\'t Array' );
  } );
} );