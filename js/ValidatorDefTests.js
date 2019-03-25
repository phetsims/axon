// Copyright 2017-2019, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Enumeration = require( 'PHET_CORE/Enumeration' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const validate = require( 'AXON/validate' );

  QUnit.module( 'Validator' );

  // Note that many validation tests are in PropertyTests
  QUnit.test( 'Test validate and ValidatorDef.isValidValue', assert => {

    window.assert && assert.throws( () => validate( 4, { validValues: [ 1, 2, 3 ] } ), 'invalid number' );
    window.assert && assert.throws( () => validate( 'hello', { valueType: Array } ), 'string isn\'t Array' );

    assert.ok( ValidatorDef.isValueValid( 3, { validValues: [ 1, 2, 3 ] } ) );
    assert.ok( ValidatorDef.isValueValid( [], { valueType: Array } ) );

    assert.ok( ValidatorDef.isValueValid( 7, { valueType: 'number', isValidValue: v => v > 5 } ) );
    assert.ok( !ValidatorDef.isValueValid( 7, { valueType: 'number', isValidValue: v => v > 7 } ) );
    assert.ok( !ValidatorDef.isValueValid( 7, { valueType: 'number', isValidValue: v => v < 3 } ) );

  } );

  QUnit.test( 'Test containsValidatorKey', assert => {
    assert.ok( ValidatorDef.containsValidatorKey( { validValues: [] }, 'has key validValues' ) );
    assert.ok( !ValidatorDef.containsValidatorKey( { shmalidValues: [] }, 'does not have key: validValues' ) );
    assert.ok( ValidatorDef.containsValidatorKey( {
      validValues: [],
      valueType: []
    }, 'does have keys: valueType and validValues' ) );
    assert.ok( ValidatorDef.containsValidatorKey( {
      validValue: [],
      valueType: []
    }, 'still have valueType and be ok even though it doesn\'t have validValues' ) );
  } );


  QUnit.test( 'Test isValidValidator and validateValidator', assert => {
    window.assert && assert.throws( () => ValidatorDef.validateValidator( {
      valueType: Array,
      isValidValue: 4
    } ), 'isValidValue should be function' );

    window.assert && assert.throws( () => ValidatorDef.isValidValidator( {
      valueType: Array,
      validValues: [ 'hi' ]

    }, { assertions: true } ), 'validValues contains invalid value' );


    assert.ok( ValidatorDef.isValidValidator( { valueType: 'number' } ), 'good valueType' );
    assert.ok( !ValidatorDef.isValidValidator( { validValue: 'number' } ), 'no validator keys supplied' );
    assert.ok( !ValidatorDef.isValidValidator( { validValue: 4 } ), 'no validator keys supplied' );
    assert.ok( !ValidatorDef.isValidValidator( { valueType: 'blaradysharady' } ), 'invalid valueType string' );
    assert.ok( ValidatorDef.isValidValidator( { isValidValue: () => {} } ), 'isValidValue is a function' );
    assert.ok( !ValidatorDef.isValidValidator( { isValidValue: 'hi' } ), 'isValidValue should not be string' );
  } );

  QUnit.test( 'Test valueType: {Enumeration}', assert => {

    const Birds = new Enumeration( [ 'ROBIN', 'JAY', 'WREN' ] );
    assert.ok( ValidatorDef.isValidValidator( { valueType: Birds } ), 'good valueType' );
    assert.ok( ValidatorDef.isValueValid( Birds.ROBIN, { valueType: Birds } ), 'good value' );
    window.assert && assert.throws( () => ValidatorDef.isValueValid( 4, { valueType: Birds } ), 'bad value' );
  } );
} );