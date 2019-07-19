// Copyright 2019, University of Colorado Boulder

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
  const Node = require( 'SCENERY/nodes/Node' );

  // constants
  const ASSERTIONS_TRUE = { assertions: true };

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

    }, ASSERTIONS_TRUE ), 'validValues contains invalid value' );


    assert.ok( ValidatorDef.isValidValidator( { valueType: 'number' } ), 'good valueType' );
    assert.ok( !ValidatorDef.isValidValidator( { validValue: 'number' } ), 'no validator keys supplied' );
    assert.ok( !ValidatorDef.isValidValidator( { validValue: 4 } ), 'no validator keys supplied' );
    assert.ok( !ValidatorDef.isValidValidator( { valueType: 'blaradysharady' } ), 'invalid valueType string' );
    assert.ok( ValidatorDef.isValidValidator( { isValidValue: () => {} } ), 'isValidValue is a function' );
    assert.ok( !ValidatorDef.isValidValidator( { isValidValue: 'hi' } ), 'isValidValue should not be string' );

    assert.ok( ValidatorDef.isValidValidator( { valueType: null } ), 'null is valid' );
    assert.ok( ValidatorDef.isValidValidator( { valueType: [ 'number', null ] } ), 'array of null and number is valid' );
    assert.ok( ValidatorDef.isValidValidator( { valueType: [ 'number', null, Node ] } ), 'array of null and number is valid' );
    assert.ok( !ValidatorDef.isValidValidator( { valueType: [ 'numberf', null, Node ] } ), 'numberf is not a valid valueType' );

    window.assert && assert.throws( () => {
      ValidatorDef.isValidValidator( undefined, { valueType: [ 'number', 'sstring' ] }, ASSERTIONS_TRUE );
    }, 'sstring is not a valid valueType' );

    window.assert && assert.throws( () => {
      ValidatorDef.isValidValidator( undefined, { valueType: [ 7 ] }, ASSERTIONS_TRUE );
    }, '7 is not a valid valueType' );

    window.assert && assert.throws( () => {
      ValidatorDef.isValidValidator( undefined, { valueType: [ 'number', {} ] }, ASSERTIONS_TRUE );
    }, 'Object literal  is not a valid valueType' );

  } );

  QUnit.test( 'Test valueType: {Array.<number|null|string|function|Enumeration>}', assert => {
    assert.ok( ValidatorDef.isValueValid( null, { valueType: null } ), 'null is valid' );
    assert.ok( ValidatorDef.isValueValid( 7, { valueType: [ 'number', null ] } ), '7 is valid for null and number' );
    assert.ok( ValidatorDef.isValueValid( null, { valueType: [ 'number', null ] } ), 'null is valid for null and number' );
    assert.ok( ValidatorDef.isValueValid( new Node(), { valueType: [ 'number', null, Node ] } ), 'Node is valid' );
    assert.ok( ValidatorDef.isValueValid( new Enumeration( [ 'ROBIN', 'JAY', 'WREN' ] ), { valueType: [ Enumeration, null, Node ] } ), 'Node is valid' );
    assert.ok( !ValidatorDef.isValueValid( 'hello', { valueType: [ 'number', null, Node ] } ), 'string not valid' );

    window.assert && assert.throws( () => validate( true, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate boolean' );
    window.assert && assert.throws( () => validate( null, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate null' );
    window.assert && assert.throws( () => validate( undefined, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );
    window.assert && assert.throws( () => validate( () => {}, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );

    const Birds = new Enumeration( [ 'ROBIN', 'JAY', 'WREN' ] );
    window.assert && assert.throws( () => validate( () => {}, { valueType: [ Birds, 'string' ] } ), 'number and string do not validate undefined' );
  } );

  QUnit.test( 'Test valueType: {Enumeration}', assert => {

    const Birds = new Enumeration( [ 'ROBIN', 'JAY', 'WREN' ] );
    assert.ok( ValidatorDef.isValidValidator( { valueType: Birds } ), 'good valueType' );
    assert.ok( ValidatorDef.isValueValid( Birds.ROBIN, { valueType: Birds } ), 'good value' );
    window.assert && assert.throws( () => ValidatorDef.isValueValid( 4, { valueType: Birds } ), 'bad value' );
  } );
} );