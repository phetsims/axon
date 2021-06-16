// Copyright 2019-2021, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import Node from '../../scenery/js/nodes/Node.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import Emitter from './Emitter.js';
import validate from './validate.js';
import ValidatorDef from './ValidatorDef.js';

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
    ValidatorDef.isValueValid( undefined, { valueType: [ 'number', 'sstring' ] }, ASSERTIONS_TRUE );
  }, 'sstring is not a valid valueType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { valueType: [ 7 ] }, ASSERTIONS_TRUE );
  }, '7 is not a valid valueType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { valueType: [ 'number', {} ] }, ASSERTIONS_TRUE );
  }, 'Object literal  is not a valid valueType' );
} );

QUnit.test( 'Test valueType: {Array.<number|null|string|function|Enumeration>}', assert => {
  assert.ok( ValidatorDef.isValueValid( null, { valueType: null } ), 'null is valid' );
  assert.ok( ValidatorDef.isValueValid( 7, { valueType: [ 'number', null ] } ), '7 is valid for null and number' );
  assert.ok( ValidatorDef.isValueValid( null, { valueType: [ 'number', null ] } ), 'null is valid for null and number' );
  assert.ok( ValidatorDef.isValueValid( new Node(), { valueType: [ 'number', null, Node ] } ), 'Node is valid' );
  assert.ok( ValidatorDef.isValueValid( Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] ), { valueType: [ Enumeration, null, Node ] } ), 'Node is valid' );
  assert.ok( !ValidatorDef.isValueValid( 'hello', { valueType: [ 'number', null, Node ] } ), 'string not valid' );

  window.assert && assert.throws( () => validate( true, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate boolean' );
  window.assert && assert.throws( () => validate( null, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate null' );
  window.assert && assert.throws( () => validate( undefined, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );
  window.assert && assert.throws( () => validate( () => {}, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );

  const Birds = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  window.assert && assert.throws( () => validate( () => {}, { valueType: [ Birds, 'string' ] } ), 'number and string do not validate undefined' );
} );

QUnit.test( 'Test valueType: {Enumeration}', assert => {

  const Birds = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  assert.ok( ValidatorDef.isValidValidator( { valueType: Birds } ), 'good valueType' );
  assert.ok( ValidatorDef.isValueValid( Birds.ROBIN, { valueType: Birds } ), 'good value' );
  window.assert && assert.throws( () => ValidatorDef.isValueValid( 4, { valueType: Birds } ), 'bad value' );
} );

QUnit.test( 'Test phetioType', assert => {
  assert.ok( ValidatorDef.isValidValidator( { phetioType: { validator: { valueType: 'number' } } } ), 'good phetioType' );
  assert.ok( ValidatorDef.isValidValidator( { phetioType: { validator: { isValidValue: () => true } } } ), 'good phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: { notValidator: { isValidValue: () => true } } } ), 'bad phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: { validator: { isValidValue: 'number' } } } ), 'bad phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: { validator: {} } } ), 'bad phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: { validator: null } } ), 'bad phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: 'null' } ), 'bad phetioType' );
  assert.ok( !ValidatorDef.isValidValidator( { phetioType: null } ), 'bad phetioType' );

  assert.ok( ValidatorDef.isValueValid( 'hello', { phetioType: StringIO } ), 'string valid' );
  assert.ok( !ValidatorDef.isValueValid( null, { phetioType: StringIO } ), 'null not valid' );
  assert.ok( !ValidatorDef.isValueValid( undefined, { phetioType: StringIO } ), 'undefined not valid' );
  assert.ok( ValidatorDef.isValueValid( 'oh hi', { phetioType: StringIO } ), 'string valid' );
  assert.ok( ValidatorDef.isValueValid( 'oh no', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith( 'o' )
  } ), 'string valid' );
  assert.ok( !ValidatorDef.isValueValid( 'ho on', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith( 'o' )
  } ), 'string not valid' );

  assert.ok( ValidatorDef.isValueValid( new Emitter(), { phetioType: Emitter.EmitterIO( [] ) } ), 'emitter is valid' );
} );

QUnit.test( 'Test arrayElementType', assert => {


  window.assert && assert.throws( () => ValidatorDef.validateValidator( {
    valueType: Array,
    arrayElementType: null
  } ), 'arrayElementType expected should not have valueType' );

  assert.ok( ValidatorDef.isValidValidator( { arrayElementType: 'number' } ), 'good valueType' );
  assert.ok( !ValidatorDef.isValidValidator( { arrayElementTypes: 'number' } ), 'no validator keys supplied' );
  assert.ok( !ValidatorDef.isValidValidator( { arrayElementTypes: 4 } ), 'no validator keys supplied' );
  assert.ok( !ValidatorDef.isValidValidator( { arrayElementType: 'blaradysharady' } ), 'invalid valueType string' );

  assert.ok( ValidatorDef.isValidValidator( { arrayElementType: null } ), 'null is valid' );
  assert.ok( ValidatorDef.isValidValidator( { arrayElementType: [ 'number', null ] } ), 'array of null and number is valid' );
  assert.ok( ValidatorDef.isValidValidator( { arrayElementType: [ 'number', null, Node ] } ), 'array of null and number is valid' );
  assert.ok( !ValidatorDef.isValidValidator( { arrayElementType: [ 'numberf', null, Node ] } ), 'numberf is not a valid arrayElementType' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5 ], { arrayElementType: [ 'number' ] } ), 'number array ok' );
  assert.ok( !ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5, null ], { arrayElementType: [ 'number' ] } ), 'number array bad with null' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5, null ], { arrayElementType: [ 'number', null ] } ), 'number array ok with null' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 'fdsaf', 3, 4, 5, null ], { arrayElementType: [ 'number', 'string', null ] } ), 'number and string array ok with null' );
  assert.ok( !ValidatorDef.isValueValid( [ 1, 'fdsaf', 3, 4, 5, null ], { arrayElementType: [ 'string', null ] } ), 'number and string array ok with null' );
  assert.ok( ValidatorDef.isValueValid( [ [], [], [], [] ], { arrayElementType: [ Array ] } ), 'array array' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', 'string' ] }, ASSERTIONS_TRUE );
  }, 'undefined is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { arrayElementType: [ 7 ] }, ASSERTIONS_TRUE );
  }, '7 is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', {} ] }, ASSERTIONS_TRUE );
  }, 'Object literal  is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( [ 'sting here, what up' ], { arrayElementType: [ 'number' ] }, ASSERTIONS_TRUE );
  }, 'sstring is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( [ 'sting here, what up' ], { arrayElementType: [ 'number' ] }, ASSERTIONS_TRUE );
  }, 'sstring is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( [ 5 ], { arrayElementType: [ 'string' ] }, ASSERTIONS_TRUE );
  }, 'sstring is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( [ null, 3, 4, 5, undefined ], { arrayElementType: [ 'number', null ] }, ASSERTIONS_TRUE );
  }, 'sstring is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { arrayElementType: [ 7 ] }, ASSERTIONS_TRUE );
  }, '7 is not a valid arrayElementType' );

  window.assert && assert.throws( () => {
    ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', {} ] }, ASSERTIONS_TRUE );
  }, 'Object literal  is not a valid arrayElementType' );
} );