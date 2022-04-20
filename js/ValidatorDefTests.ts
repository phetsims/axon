// Copyright 2019-2022, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import { Node } from '../../scenery/js/imports.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import Emitter from './Emitter.js';
import Property from './Property.js';
import validate from './validate.js';
import ValidatorDef, { Validator } from './ValidatorDef.js';

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
  assert.ok( ValidatorDef.containsValidatorKey( { validValues: [] } ), 'has key validValues' );
  assert.ok( !ValidatorDef.containsValidatorKey( { shmalidValues: [] } ), 'does not have key: validValues' );
  assert.ok( ValidatorDef.containsValidatorKey( {
    validValues: [],
    valueType: []
  } ), 'does have keys: valueType and validValues' );
  assert.ok( ValidatorDef.containsValidatorKey( {
    validValue: [],
    valueType: []
  } ), 'still have valueType and be ok even though it doesn\'t have validValues' );
} );


QUnit.test( 'Test getValidatorValidationError and validateValidator', assert => {
  window.assert && assert.throws( () => ValidatorDef.validateValidator( {
    valueType: Array,

    // @ts-ignore
    isValidValue: 4
  } ), 'isValidValue should be function' );

  window.assert && assert.ok( typeof ValidatorDef.getValidatorValidationError( {
    valueType: Array,
    validValues: [ 'hi' ]

  } ) === 'string', 'validValues contains invalid value' );

  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: 'number' } ), 'good valueType' );

  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { validValue: 'number' } ), 'no validator keys supplied' );

  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { validValue: 4 } ), 'no validator keys supplied' );
  assert.ok( ValidatorDef.getValidatorValidationError( { valueType: 'blaradysharady' } ), 'invalid valueType string' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { isValidValue: () => {} } ), 'isValidValue is a function' );

  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { isValidValue: 'hi' } ), 'isValidValue should not be string' );

  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: null } ), 'null is valid' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: [ 'number', null ] } ), 'array of null and number is valid' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: [ 'number', null, Node ] } ), 'array of null and number is valid' );
  assert.ok( ValidatorDef.getValidatorValidationError( { valueType: [ 'numberf', null, Node ] } ), 'numberf is not a valid valueType' );

  assert.ok( !ValidatorDef.isValueValid( undefined, { valueType: [ 'number', 'sstring' ] } ), 'sstring is not a valid valueType' );

  // @ts-ignore
  assert.ok( !ValidatorDef.isValueValid( undefined, { valueType: [ 7 ] }, ASSERTIONS_TRUE ), '7 is not a valid valueType' );

  // @ts-ignore
  assert.ok( !ValidatorDef.isValueValid( undefined, { valueType: [ 'number', {} ] }, ASSERTIONS_TRUE ), 'Object literal  is not a valid valueType' );
} );

QUnit.test( 'Test valueType: {Array.<number|null|string|function|EnumerationDeprecated>}', assert => {
  assert.ok( ValidatorDef.isValueValid( null, { valueType: null } ), 'null is valid' );
  assert.ok( ValidatorDef.isValueValid( 7, { valueType: [ 'number', null ] } ), '7 is valid for null and number' );
  assert.ok( ValidatorDef.isValueValid( null, { valueType: [ 'number', null ] } ), 'null is valid for null and number' );
  assert.ok( ValidatorDef.isValueValid( new Node(), { valueType: [ 'number', null, Node ] } ), 'Node is valid' );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] ), { valueType: [ EnumerationDeprecated, null, Node ] } ), 'Node is valid' );
  assert.ok( !ValidatorDef.isValueValid( 'hello', { valueType: [ 'number', null, Node ] } ), 'string not valid' );

  window.assert && assert.throws( () => validate( true, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate boolean' );
  window.assert && assert.throws( () => validate( null, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate null' );
  window.assert && assert.throws( () => validate( undefined, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );
  window.assert && assert.throws( () => validate( () => {}, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  window.assert && assert.throws( () => validate( () => {}, { valueType: [ Birds, 'string' ] } ), 'number and string do not validate undefined' );
} );

QUnit.test( 'Test valueType: {EnumerationDeprecated}', assert => {

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: Birds } ), 'good valueType' );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( Birds.ROBIN, { valueType: Birds } ), 'good value' );
  assert.ok( !ValidatorDef.isValueValid( 4, { valueType: Birds } ), 'bad value' );
} );

QUnit.test( 'Test phetioType', assert => {

  // Stub phetioType here for testing. ts-ignores may be able to be removed when IOType is in typescript.
  // @ts-ignore
  assert.ok( !ValidatorDef.getValidatorValidationError( { phetioType: { validator: { valueType: 'number' } } } ), 'good phetioType' );
  // @ts-ignore
  assert.ok( !ValidatorDef.getValidatorValidationError( { phetioType: { validator: { isValidValue: () => true } } } ), 'good phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: { notValidator: { isValidValue: () => true } } } ), 'bad phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: { validator: { isValidValue: 'number' } } } ), 'bad phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: { validator: {} } } ), 'bad phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: { validator: null } } ), 'bad phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: 'null' } ), 'bad phetioType' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { phetioType: null } ), 'bad phetioType' );

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
    valueType: 'not array',
    arrayElementType: null
  } ), 'arrayElementType expected should not have valueType or for it to be "Array"' );

  assert.ok( !ValidatorDef.getValidatorValidationError( { arrayElementType: 'number' } ), 'good valueType' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { valueType: Array, arrayElementType: 'number' } ), 'does not matter if valueType: Array is provided' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { arrayElementTypes: 'number' } ), 'no validator keys supplied' );
  // @ts-ignore
  assert.ok( ValidatorDef.getValidatorValidationError( { arrayElementTypes: 4 } ), 'no validator keys supplied' );
  assert.ok( ValidatorDef.getValidatorValidationError( { arrayElementType: 'blaradysharady' } ), 'invalid valueType string' );

  assert.ok( !ValidatorDef.getValidatorValidationError( { arrayElementType: null } ), 'null is valid' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { arrayElementType: [ 'number', null ] } ), 'array of null and number is valid' );
  assert.ok( !ValidatorDef.getValidatorValidationError( { arrayElementType: [ 'number', null, Node ] } ), 'array of null and number is valid' );
  assert.ok( ValidatorDef.getValidatorValidationError( { arrayElementType: [ 'numberf', null, Node ] } ), 'numberf is not a valid arrayElementType' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5 ], { arrayElementType: [ 'number' ] } ), 'number array ok' );
  assert.ok( !ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5, null ], { arrayElementType: [ 'number' ] } ), 'number array bad with null' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 2, 3, 4, 5, null ], { arrayElementType: [ 'number', null ] } ), 'number array ok with null' );
  assert.ok( ValidatorDef.isValueValid( [ 1, 'fdsaf', 3, 4, 5, null ], { arrayElementType: [ 'number', 'string', null ] } ), 'number and string array ok with null' );
  assert.ok( !ValidatorDef.isValueValid( [ 1, 'fdsaf', 3, 4, 5, null ], { arrayElementType: [ 'string', null ] } ), 'number and string array ok with null' );
  assert.ok( ValidatorDef.isValueValid( [ [], [], [], [] ], { arrayElementType: [ Array ] } ), 'array array' );
  assert.ok( ValidatorDef.isValueValid( [ [ 4 ], [ 'other' ], null, [] ], { arrayElementType: [ Array, null ] } ), 'array {array|null}' );
  assert.ok( ValidatorDef.isValueValid( [ [ 4 ], [ 'other' ], null, 432, [] ], { arrayElementType: [ Array, null, 'number' ] } ), 'array {array|null|number}' );

  assert.ok( ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', 'string' ] } ) !== null, ' undefined as a value for array!' );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( undefined, { arrayElementType: [ 7 ] } ) !== null, '7 is not a valid arrayElementType' );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', {} ] } ) !== null, 'Object literal  is not a valid arrayElementType' );

  assert.ok( ValidatorDef.isValueValid( [ 'sting here, what up' ], { arrayElementType: [ 'number' ] } ) !== null );

  assert.ok( ValidatorDef.isValueValid( [ 'sting here, what up' ], { arrayElementType: [ 'number' ] } ) !== null );

  assert.ok( ValidatorDef.isValueValid( [ 5 ], { arrayElementType: [ 'string' ] } ) !== null );

  assert.ok( ValidatorDef.isValueValid( [ null, 3, 4, 5, undefined ], { arrayElementType: [ 'number', null ] } ) !== null );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( undefined, { arrayElementType: [ 7 ] } ) !== null, '7 is not a valid arrayElementType' );

  // @ts-ignore
  assert.ok( ValidatorDef.isValueValid( undefined, { arrayElementType: [ 'number', {} ] } ) !== null, 'Object literal  is not a valid arrayElementType' );
} );

QUnit.test( 'validationMessage is presented for all validation errors', assert => {

  const testContainsErrorMessage = ( value: any, validator: Validator, message = validator.validationMessage ) => {
    assert.ok( message, 'should have a message' );
    const validationError = ValidatorDef.getValidationError( value, validator );
    assert.ok( validationError && validationError.includes( message! ), message );
  };

  testContainsErrorMessage( 5, { valueType: 'boolean', validationMessage: 'valueType boolean, value number' } );
  testContainsErrorMessage( true, { valueType: 'number', validationMessage: 'valueType number, value boolean' } );
  testContainsErrorMessage( true, { valueType: [ 'string', 'number' ], validationMessage: 'valueType string`,number value boolean' } );
  testContainsErrorMessage( true, { valueType: [ null, 'number' ], validationMessage: 'valueType null,number value boolean' } );
  testContainsErrorMessage( false, { validValues: [ 'hi', true ], validationMessage: 'validValues with value:false' } );
  testContainsErrorMessage( 5, { validValues: [ 'hi', true ], validationMessage: 'validValues with value:5' } );
  testContainsErrorMessage( true, { arrayElementType: 'boolean', validationMessage: 'arrayElementType with value:true' } );
  testContainsErrorMessage( [ 4 ], { arrayElementType: 'boolean', validationMessage: 'arrayElementType with value:4' } );
  testContainsErrorMessage( [ 4, true, 'hi' ], { arrayElementType: [ 'boolean', 'number' ], validationMessage: 'arrayElementType with value:[hi]' } );
  testContainsErrorMessage( 4, { isValidValue: v => v === 3, validationMessage: 'isValidValue 3, value 4' } );
  testContainsErrorMessage( 'oh hello', { phetioType: Property.PropertyIO( BooleanIO ), validationMessage: 'isValidValue 3, value string' } );

  const ioType = new IOType( 'TestIO', { valueType: 'boolean' } );
  const ioTypeValidationMessage = 'should be a boolean from this IOType in tests';

  // @ts-ignore, should be fixed once IOType is in typescript, but we still may not be able to mutate it.
  ioType.validator.validationMessage = ioTypeValidationMessage;
  testContainsErrorMessage( 'hi', { phetioType: ioType }, ioTypeValidationMessage );
} );

QUnit.test( 'Validator.containsValidatorKey', assert => {

  assert.ok( !ValidatorDef.containsValidatorKey( undefined ), 'undefined: no validator key' );
  assert.ok( !ValidatorDef.containsValidatorKey( null ), 'null: no validator key' );
  assert.ok( !ValidatorDef.containsValidatorKey( 5 ), 'number: no validator key' );
  assert.ok( !ValidatorDef.containsValidatorKey( { fdsaf: true } ), 'undefined: no validator key' );
  assert.ok( !ValidatorDef.containsValidatorKey( new IOType( 'TestIO', { valueType: 'string' } ) ), 'undefined: no validator key' );
  assert.ok( ValidatorDef.containsValidatorKey( { valueType: 'fdsaf' } ), 'has valueType, even though valueType has the wrong value' );
} );