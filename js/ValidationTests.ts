// Copyright 2019-2023, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Vector2 from '../../dot/js/Vector2.js';
import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import { Node } from '../../scenery/js/imports.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import Emitter from './Emitter.js';
import Property from './Property.js';
import validate from './validate.js';
import Validation, { Validator } from './Validation.js';

// constants
const ASSERTIONS_TRUE = { assertions: true };

QUnit.module( 'Validator' );

// Note that many validation tests are in PropertyTests
QUnit.test( 'Test validate and Validation.isValidValue', assert => {

  window.assert && assert.throws( () => validate( 4, { validValues: [ 1, 2, 3 ] } ), 'invalid number' );
  window.assert && assert.throws( () => validate( 'hello', { valueType: Array } ), 'string isn\'t Array' );

  assert.ok( Validation.isValueValid( 3, { validValues: [ 1, 2, 3 ] } ) );
  assert.ok( Validation.isValueValid( [], { valueType: Array } ) );

  assert.ok( Validation.isValueValid( 7, { valueType: 'number', isValidValue: ( v: number ) => v > 5 } ) );
  assert.ok( !Validation.isValueValid( 7, { valueType: 'number', isValidValue: ( v: number ) => v > 7 } ) );
  assert.ok( !Validation.isValueValid( 7, { valueType: 'number', isValidValue: ( v: number ) => v < 3 } ) );

} );

QUnit.test( 'Test containsValidatorKey', assert => {
  assert.ok( Validation.containsValidatorKey( { validValues: [] } ), 'has key validValues' );
  assert.ok( !Validation.containsValidatorKey( { shmalidValues: [] } ), 'does not have key: validValues' );
  assert.ok( Validation.containsValidatorKey( {
    validValues: [],
    valueType: []
  } ), 'does have keys: valueType and validValues' );
  assert.ok( Validation.containsValidatorKey( {
    validValue: [],
    valueType: []
  } ), 'still have valueType and be ok even though it doesn\'t have validValues' );

  assert.ok( !Validation.containsValidatorKey( undefined ), 'undefined: no validator key' );
  assert.ok( !Validation.containsValidatorKey( null ), 'null: no validator key' );
  assert.ok( !Validation.containsValidatorKey( 5 ), 'number: no validator key' );
  assert.ok( !Validation.containsValidatorKey( { fdsaf: true } ), 'undefined: no validator key' );
  assert.ok( !Validation.containsValidatorKey( new IOType( 'TestIO', { valueType: 'string' } ) ), 'undefined: no validator key' );
  assert.ok( Validation.containsValidatorKey( { valueType: 'fdsaf' } ), 'has valueType, even though valueType has the wrong value' );
} );


QUnit.test( 'Test getValidatorValidationError and validateValidator', assert => {
  window.assert && assert.throws( () => Validation.validateValidator( {
    valueType: Array,

    // @ts-expect-error INTENTIONAL
    isValidValue: 4
  } ), 'isValidValue should be function' );

  window.assert && assert.ok( typeof Validation.getValidatorValidationError( {
    valueType: Array,
    validValues: [ 'hi' ]

  } ) === 'string', 'validValues contains invalid value' );

  assert.ok( !Validation.getValidatorValidationError( { valueType: 'number' } ), 'good valueType' );

  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { validValue: 'number' } ), 'no validator keys supplied' );

  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { validValue: 4 } ), 'no validator keys supplied' );
  assert.ok( Validation.getValidatorValidationError( { valueType: 'blaradysharady' } ), 'invalid valueType string' );

  assert.ok( !Validation.getValidatorValidationError( { isValidValue: () => true } ), 'isValidValue is a function' );

  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { isValidValue: 'hi' } ), 'isValidValue should not be string' );

  assert.ok( !Validation.getValidatorValidationError( { valueType: null } ), 'null is valid' );
  assert.ok( !Validation.getValidatorValidationError( { valueType: [ 'number', null ] } ), 'array of null and number is valid' );
  assert.ok( !Validation.getValidatorValidationError( { valueType: [ 'number', null, Node ] } ), 'array of null and number is valid' );
  assert.ok( Validation.getValidatorValidationError( { valueType: [ 'numberf', null, Node ] } ), 'numberf is not a valid valueType' );

  assert.ok( !Validation.isValueValid( undefined, { valueType: [ 'number', 'sstring' ] } ), 'sstring is not a valid valueType' );

  // @ts-expect-error
  assert.ok( !Validation.isValueValid( undefined, { valueType: [ 7 ] }, ASSERTIONS_TRUE ), '7 is not a valid valueType' );

  // @ts-expect-error
  assert.ok( !Validation.isValueValid( undefined, { valueType: [ 'number', {} ] }, ASSERTIONS_TRUE ), 'Object literal  is not a valid valueType' );
} );

QUnit.test( 'Test valueType: {Array.<number|null|string|function|EnumerationDeprecated>}', assert => {
  assert.ok( Validation.isValueValid( null, { valueType: null } ), 'null is valid' );
  assert.ok( Validation.isValueValid( 7, { valueType: [ 'number', null ] } ), '7 is valid for null and number' );
  assert.ok( Validation.isValueValid( null, { valueType: [ 'number', null ] } ), 'null is valid for null and number' );
  assert.ok( Validation.isValueValid( new Node(), { valueType: [ 'number', null, Node ] } ), 'Node is valid' );
  assert.ok( Validation.isValueValid( EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] ), { valueType: [ EnumerationDeprecated, null, Node ] } ), 'Node is valid' );
  assert.ok( !Validation.isValueValid( 'hello', { valueType: [ 'number', null, Node ] } ), 'string not valid' );

  window.assert && assert.throws( () => validate( true, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate boolean' );
  window.assert && assert.throws( () => validate( null, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate null' );
  window.assert && assert.throws( () => validate( undefined, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );
  window.assert && assert.throws( () => validate( _.noop, { valueType: [ 'number', 'string' ] } ), 'number and string do not validate undefined' );

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  window.assert && assert.throws( () => validate( _.noop, { valueType: [ Birds, 'string' ] } ), 'number and string do not validate undefined' );
} );

QUnit.test( 'Test valueType: {EnumerationDeprecated}', assert => {

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  assert.ok( !Validation.getValidatorValidationError( { valueType: Birds } ), 'good valueType' );

  // @ts-expect-error
  assert.ok( Validation.isValueValid( Birds.ROBIN, { valueType: Birds } ), 'good value' );
  assert.ok( !Validation.isValueValid( 4, { valueType: Birds } ), 'bad value' );
} );

QUnit.test( 'Test phetioType', assert => {

  // Stub phetioType here for testing. ts-expect-errors may be able to be removed when IOType is in typescript.
  // @ts-expect-error
  assert.ok( !Validation.getValidatorValidationError( { phetioType: { validator: { valueType: 'number' } } } ), 'good phetioType' );
  // @ts-expect-error
  assert.ok( !Validation.getValidatorValidationError( { phetioType: { validator: { isValidValue: () => true } } } ), 'good phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: { notValidator: { isValidValue: () => true } } } ), 'bad phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: { validator: { isValidValue: 'number' } } } ), 'bad phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: { validator: {} } } ), 'bad phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: { validator: null } } ), 'bad phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: 'null' } ), 'bad phetioType' );
  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { phetioType: null } ), 'bad phetioType' );

  assert.ok( Validation.isValueValid( 'hello', { phetioType: StringIO } ), 'string valid' );
  assert.ok( !Validation.isValueValid( null, { phetioType: StringIO } ), 'null not valid' );
  assert.ok( !Validation.isValueValid( undefined, { phetioType: StringIO } ), 'undefined not valid' );
  assert.ok( Validation.isValueValid( 'oh hi', { phetioType: StringIO } ), 'string valid' );
  assert.ok( Validation.isValueValid( 'oh no', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith( 'o' )
  } ), 'string valid' );
  assert.ok( !Validation.isValueValid( 'ho on', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith( 'o' )
  } ), 'string not valid' );

  assert.ok( Validation.isValueValid( new Emitter(), { phetioType: Emitter.EmitterIO( [] ) } ), 'emitter is valid' );
} );

QUnit.test( 'validationMessage is presented for all validation errors', assert => {

  const testContainsErrorMessage = ( value: number | boolean | string | number[] | Array<number | boolean | string>, validator: Validator, message = validator.validationMessage ) => {
    assert.ok( message, 'should have a message' );
    const validationError = Validation.getValidationError( value, validator );
    assert.ok( validationError && validationError.includes( message! ), message );
  };

  testContainsErrorMessage( 5, { valueType: 'boolean', validationMessage: 'valueType boolean, value number' } );
  testContainsErrorMessage( true, { valueType: 'number', validationMessage: 'valueType number, value boolean' } );
  testContainsErrorMessage( true, { valueType: [ 'string', 'number' ], validationMessage: 'valueType string`,number value boolean' } );
  testContainsErrorMessage( true, { valueType: [ null, 'number' ], validationMessage: 'valueType null,number value boolean' } );
  testContainsErrorMessage( false, { validValues: [ 'hi', true ], validationMessage: 'validValues with value:false' } );
  testContainsErrorMessage( 5, { validValues: [ 'hi', true ], validationMessage: 'validValues with value:5' } );
  testContainsErrorMessage( 4, { isValidValue: v => v === 3, validationMessage: 'isValidValue 3, value 4' } );
  testContainsErrorMessage( 'oh hello', { phetioType: Property.PropertyIO( BooleanIO ), validationMessage: 'isValidValue 3, value string' } );

  const ioType = new IOType( 'TestIO', { valueType: 'boolean' } );
  const ioTypeValidationMessage = 'should be a boolean from this IOType in tests';

  ioType.validator.validationMessage = ioTypeValidationMessage;
  testContainsErrorMessage( 'hi', { phetioType: ioType }, ioTypeValidationMessage );
} );

QUnit.test( 'test Validator.validators', assert => {

  assert.ok( !Validation.getValidatorValidationError( { validators: [ { valueType: 'boolean' }, { isValidValue: v => v === false } ] } ), 'correct validator' );

  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { validators: [ { valueType: 'boolean' }, { isValidValue: 7 } ] } ), 'incorrect validator' );

  // @ts-expect-error
  assert.ok( Validation.getValidatorValidationError( { validators: [ { valueType: 'boolean' }, 7 ] } ), 'incorrect validator2' );

  assert.ok( Validation.getValidationError( '7', { validators: [ { valueType: 'boolean' }, { isValidValue: v => v === false } ] } ) );
  assert.ok( Validation.getValidationError( true, { validators: [ { valueType: 'boolean' }, { isValidValue: v => v === false } ] } ) );
  assert.ok( Validation.getValidationError( undefined, { validators: [ { valueType: 'boolean' }, { isValidValue: v => v === false } ] } ) );
  assert.ok( !Validation.getValidationError( false, { validators: [ { valueType: 'boolean' }, { isValidValue: v => v === false } ] } ) );
} );

QUnit.test( 'Validator.valueComparisonStrategy', assert => {

  const myValueArray = [ 7, 6, 5 ];

  // @ts-expect-error wrong value for valueComparisonStrategy
  assert.ok( Validation.getValidatorValidationError( { valueComparisonStrategy: 'referfdsafdsence' } ),
    'that is not a correct valueComparisonStrategy' );

  assert.ok( !Validation.getValidationError( myValueArray, {
    validators: [ { validValues: [ myValueArray ], valueComparisonStrategy: 'reference' } ]
  } ) );

  assert.ok( !Validation.getValidationError( myValueArray, {
    validators: [ { validValues: [ [ 7, 6, 5 ] ], valueComparisonStrategy: 'lodashDeep' } ]
  } ) );

  assert.ok( Validation.getValidationError( myValueArray, {
    validators: [ { validValues: [ [ 7, 6, 5 ] ], valueComparisonStrategy: 'reference' } ]
  } ), 'That isn\'t the same array!' );

  window.assert && assert.throws( () => {
    Validation.getValidationError( myValueArray, {
      validators: [ { validValues: [ [ 7, 6, 5 ] ], valueComparisonStrategy: 'equalsFunction' } ]
    } );
  }, 'arrays do not have an equals function' );

  assert.ok( !Validation.getValidationError( new Vector2( 0, 0 ), {
    validators: [ { validValues: [ new Vector2( 0, 1 ), new Vector2( 0, 0 ) ], valueComparisonStrategy: 'equalsFunction' } ]
  } ) );

  assert.ok( Validation.getValidationError( new Vector2( 0, 2 ), {
    validators: [ { validValues: [ new Vector2( 0, 1 ), new Vector2( 0, 0 ) ], valueComparisonStrategy: 'equalsFunction' } ]
  } ) );

  assert.ok( Validation.getValidationError<Vector2>( new Vector2( 0, 2 ), {
    validators: [ {
      validValues: [ new Vector2( 0, 100 ), new Vector2( 2, 2 ) ],

      // compare only the x values.
      valueComparisonStrategy: ( a, b ) => a.x === b.x
    } ]
  } ) );
} );