// Copyright 2017-2019, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const validate = require( 'AXON/validate' );

  QUnit.module( 'Validator' );

  // Note that many validation tests are in PropertyTests
  QUnit.test( 'Test validate and ValidatorDef', assert => {

    assert.ok( validate( 3, { validValues: [ 1, 2, 3 ] } ) );
    assert.ok( validate( [], { valueType: Array } ) );
    window.assert && assert.throws( () => !validate( 4, { validValues: [ 1, 2, 3 ] } ), 'invalid number' );
    window.assert && assert.throws( () => !validate( 'hello', { valueType: Array } ), 'string isn\'t Array' );

    window.assert && assert.throws( () => !ValidatorDef.validateValidator( {
      valueType: Array,
      isValidValue: 4
    } ), 'isValidValue should be function' );
  } );
} );