// Copyright 2019-2022, University of Colorado Boulder

// @ts-nocheck

/**
 * The definition file for "validators" used to validate values. This file holds associated logic that validates the
 * schema of the "validator" object, as well as testing if a value adheres to the restrictions provided by a validator.
 * See validate.js for usage with assertions to check that values are valid.
 *
 * Examples:
 *
 * A {ValidatorDef} (commonly know as "validator") that only accepts number values:
 * { valueType: 'number' }
 *
 * A validator that only accepts the numbers "2" or "3":
 * { valueType: 'number', validValues: [ 2, 3 ] }
 *
 * A validator that accepts any Object:
 * { valueType: Object }
 *
 * A validator that accepts EnumerationDeprecated values (NOTE! This is deprecated, use the new class-based enumeration pattern as the valueType):
 * { valueType: MyEnumeration }
 * and/or
 * { validValues: MyEnumeration.VALUES }
 *
 * A validator that accepts a string or a number greater than 2:
 * { isValidValue: value => { typeof value === 'string' || (typeof value === 'number' && value > 2)} }
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import Constructor from '../../phet-core/js/types/Constructor.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import optionize from '../../phet-core/js/optionize.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';

const TYPEOF_STRINGS = [ 'string', 'number', 'boolean', 'function' ];

// Options passed to ValidatorDef functions.
export type ValidationOptions = {

  // if true, throw an assertion instead of returning a boolean as to whether the value is valid
  assertions?: boolean;
}

export type IsValidValueOptions = {

  // By default validation will always check the validity of the  validator itself.  However, for types like
  // Property and Emitter re-checking the validator every time the Property value changes or the Emitter emits
  // wastes cpu. Hence cases like those can opt-out
  validateValidator?: boolean;

  // if provided, this will provide supplemental information to the assertion messages in addition to the
  // validate-key-specific message that will be given.
  message?: string | null;
} & ValidationOptions;

const ASSERTIONS_FALSE: ValidationOptions = { assertions: false };
const ASSERTIONS_TRUE: ValidationOptions = { assertions: true };

type ValueType = string | Constructor | EnumerationDeprecated | null | ValueType[];
export type Validator = {
  valueType?: ValueType | ValueType[];
  validValues?: any[] | null;
  isValidValue?: ( v?: any ) => boolean | null | void;
  arrayElementType?: ValueType;
  phetioType?: IOType;
}

// Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
// same semantics so that we can use this feature without having extend and allocate new objects at every validation.
const VALIDATOR_KEYS: Array<keyof Validator> = [

  // {function|string|null} type of the value.
  // If {function}, the function must be a constructor.
  // If {string}, the string must be one of the primitive types listed in TYPEOF_STRINGS.
  // If {null|undefined}, the value must be null (which doesn't make sense until the next line of doc)
  // If {Array.<string|function|null|undefined>}, each item must be a legal value as explained in the above doc
  // Unused if null.
  // Examples:
  // valueType: Vector2
  // valueType: 'string'
  // valueType: 'number',
  // valueType: [ 'number', null ]
  // valueType: [ 'number', 'string', Node, null ]
  'valueType',

  // {*[]|null} valid values for this Property. Unused if null.
  // Example:
  // validValues: [ 'horizontal', 'vertical' ]
  'validValues',

  // {function|null} function that validates the value. Single argument is the value, returns boolean. Unused if null.
  // Example:
  // isValidValue: function( value ) { return Number.isInteger( value ) && value >= 0; }
  'isValidValue',

  // This option takes the same types as are supported with `valueType`. This option is to specify the type of the
  // elements of an array. For this option to valid, `valueType` must either be omitted, or be `Array`. It is assumed that
  // valueType is `Array`.
  'arrayElementType',

  // {IOType} - A IOType used to specify the public typing for PhET-iO. Each IOType must have a
  // `validator` key specified that can be used for validation. See IOType for an example.
  'phetioType'
];

class ValidatorDef {

  /**
   * Throws assertion errors if the validator is invalid.
   */
  static isValidValidator( validator: Validator, providedOptions?: ValidationOptions ): boolean {

    const options = providedOptions || ASSERTIONS_FALSE;// Poor man's extend

    if ( !( validator instanceof Object ) ) {
      assert && options.assertions && assert( false,
        'validator must be an Object' );
      return false;
    }
    if ( !( validator.hasOwnProperty( 'isValidValue' ) ||
            validator.hasOwnProperty( 'valueType' ) ||
            validator.hasOwnProperty( 'arrayElementType' ) ||
            validator.hasOwnProperty( 'validValues' ) ||
            validator.hasOwnProperty( 'phetioType' ) ) ) {
      assert && options.assertions && assert( false,
        'validator must have at least one of: isValidValue, valueType, validValues' );
      return false;
    }

    if ( validator.hasOwnProperty( 'valueType' ) && !validateValueOrElementType( validator.valueType, options ) ) {
      return false;
    }

    if ( validator.hasOwnProperty( 'arrayElementType' ) ) {
      if ( validator.hasOwnProperty( 'valueType' ) && validator.valueType !== Array ) {
        assert && options.assertions && assert( false, 'valueType must be "Array" when specified with arrayElementType.' );
        return false;
      }
      if ( !validateValueOrElementType( validator.arrayElementType, options ) ) {
        return false;
      }
    }

    if ( validator.hasOwnProperty( 'isValidValue' ) ) {
      if ( !( typeof validator.isValidValue === 'function' ||
              validator.isValidValue === null ||
              validator.isValidValue === undefined ) ) {
        assert && options.assertions && assert( false, `isValidValue must be a function: ${validator.isValidValue}` );
        return false;
      }
    }

    if ( validator.validValues !== undefined && validator.validValues !== null ) {
      if ( !Array.isArray( validator.validValues ) ) {
        assert && options.assertions && assert( false, `validValues must be an array: ${validator.validValues}` );
        return false;
      }

      // Make sure each validValue matches the other rules, if any.
      const validatorWithoutValidValues = _.omit( validator, 'validValues' );
      if ( ValidatorDef.containsValidatorKey( validatorWithoutValidValues ) ) {
        for ( let i = 0; i < validator.validValues.length; i++ ) {
          if ( !ValidatorDef.isValueValid( validator.validValues[ i ], validatorWithoutValidValues ) ) {
            assert && options.assertions && assert( false, `Item not valid: ${validator.validValues[ i ]}` );
            return false;
          }
        }
      }
    }

    if ( validator.hasOwnProperty( 'phetioType' ) ) {
      if ( !( validator.phetioType && validator.phetioType.validator ) ) {
        assert && options.assertions && assert( false, `validator needed for phetioType: ${validator.phetioType && validator.phetioType.typeName}` );
        return false;
      }
      return ValidatorDef.isValidValidator( validator.phetioType.validator, options );
    }
    return true;
  }

  /**
   * Validate that the valueType is of the expected format.
   * @private
   * @param valueType
   * @param {Object} [options] - required, options from isValidValidator
   * @returns {boolean} - true if valid
   */
  static validateValueType( valueType, options ) {
    if ( !( typeof valueType === 'function' ||
            typeof valueType === 'string' ||
            valueType instanceof EnumerationDeprecated ||
            valueType === null ||
            valueType === undefined ) ) {
      assert && options.assertions && assert( false,
        `valueType must be {function|string|EnumerationDeprecated|null|undefined}, valueType=${valueType}` );
      return false;
    }

    // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
    if ( typeof valueType === 'string' ) {
      if ( !_.includes( TYPEOF_STRINGS, valueType ) ) {
        assert && options.assertions && assert( false, `valueType not a supported primitive types: ${valueType}` );
        return false;
      }
    }
    return true;
  }

  /**
   * Throws assertion errors if the validator is invalid.
   */
  static validateValidator( validator: Validator ): void {

    // Specify that assertions should be thrown if there are problems during the validation check.
    assert && ValidatorDef.isValidValidator( validator, ASSERTIONS_TRUE );
  }

  /**
   * @param validator - object which may or may not contain validation keys
   */
  static containsValidatorKey( validator: IntentionalAny ): boolean {
    for ( let i = 0; i < VALIDATOR_KEYS.length; i++ ) {
      if ( validator.hasOwnProperty( VALIDATOR_KEYS[ i ] ) ) {
        return true;
      }
    }
    return false;
  }

  private static formulateAssertionMessage( genericMessage: string, specificMessage: string ): string {
    if ( specificMessage ) {
      genericMessage = `${specificMessage}: ${genericMessage}`;
    }
    return genericMessage;
  }

  /**
   * Determines whether a value is valid (returning a boolean value), and optionally throws an assertion error if the
   * value is not valid.  The reason assertions are (optionally) thrown from this method is so that we can have more
   * specific error messages.
   *
   * @throws {Error} assertion error if not valid and options.assertions is true
   */
  static isValueValid( value: IntentionalAny, validator: Validator, providedOptions?: IsValidValueOptions ): boolean {

    const options = optionize<IsValidValueOptions>( {

      // {boolean} - By default validation will always check the validity of the  validator itself.  However, for types like
      // Property and Emitter re-checking the validator every time the Property value changes or the Emitter emits
      // wastes cpu. Hence cases like those can opt-out
      validateValidator: true,

      // if true, throw an assertion "instead" of waiting to return a boolean
      assertions: false,

      // {string} - if provided, this will provide supplemental information to the assertion messages in addition to the
      // validate-key-specific message that will be given.
      message: null
    }, providedOptions );

    // Use the same policy for whether to throw assertions when checking the validator itself.
    if ( options.validateValidator && !axon.ValidatorDef.isValidValidator( validator, options ) ) {
      assert && options.assertions && assert( false, 'Invalid validator' );
      return false;
    }

    // Check valueType, which can be an array, string, type, or null
    if ( validator.hasOwnProperty( 'valueType' ) ) {
      const valueType = validator.valueType;
      if ( Array.isArray( valueType ) ) {

        // Only one should be valid, so error out if none of them returned valid
        // Hard code assertions false because most will fail, instead have a general assertion here.
        if ( !_.some( valueType.map( typeInArray => ValidatorDef.isValueValidValueType( value, typeInArray, options.message, ASSERTIONS_FALSE ) ) ) ) {
          assert && options.assertions && assert( false, this.formulateAssertionMessage( `value not valid for any valueType in ${valueType}, value: ${value}`, options.message ) );
          return false;
        }
      }
      else if ( valueType ) {
        if ( !ValidatorDef.isValueValidValueType( value, valueType, options.message, options ) ) {
          return false;
        }
      }
    }

    if ( validator.hasOwnProperty( 'arrayElementType' ) ) {
      const arrayElementType = validator.arrayElementType;

      // If using arrayElementType, then the value should be an array. No need for assertions, because nested
      // isValueValid will assert out if asserting.
      if ( !ValidatorDef.isValueValid( value, { valueType: Array }, options ) ) {
        return false;
      }

      // every element in the array should pass
      if ( !_.every( value.map( arrayElement => {

        // if the type is an array, then handle it like we did for valueType, with _.some
        if ( Array.isArray( arrayElementType ) ) {
          if ( !_.some( arrayElementType.map( typeInArray => ValidatorDef.isValueValidValueType( arrayElement, typeInArray, options.message, ASSERTIONS_FALSE ) ) ) ) {
            assert && options.assertions && assert( false, this.formulateAssertionMessage( `array element not valid for any arrayElementType in ${arrayElementType}, value: ${arrayElement}`, options.message ) );
            return false;
          }
          return true;
        }
        else {

          // if not an array, then just check the array element
          return ValidatorDef.isValueValidValueType( arrayElement, validator.arrayElementType, options.message, options );
        }
      } ) ) ) {
        return false; // if every element didn't pass, then return false
      }
    }

    if ( validator.hasOwnProperty( 'validValues' ) && validator.validValues.indexOf( value ) === -1 ) {
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value not in validValues: ${value}`, options.message ) );
      return false;
    }
    if ( validator.hasOwnProperty( 'isValidValue' ) && !validator.isValidValue( value ) ) {
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value failed isValidValue: ${value}`, options.message ) );
      return false;
    }
    if ( validator.hasOwnProperty( 'phetioType' ) &&

         // Never assert, instead handling it here for the better assertion message.
         !ValidatorDef.isValueValid( value, validator.phetioType.validator, ASSERTIONS_FALSE ) ) {
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value failed phetioType validator: ${value}`, options.message ) );
      return false;
    }
    return true;
  }

  /**
   * @throws {Error} assertion error if not valid and options.assertions is true
   */
  private static isValueValidValueType( value: IntentionalAny, valueType: ValueType, message: string | null, options: ValidationOptions ): boolean {
    if ( typeof valueType === 'string' && typeof value !== valueType ) { // primitive type
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value should have typeof ${valueType}, value=${value}`, message ) );
      return false;
    }
    else if ( valueType === Array && !Array.isArray( value ) ) {
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value should have been an array, value=${value}`, message ) );
      return false;
    }
    else if ( valueType instanceof EnumerationDeprecated && !valueType.includes( value ) ) {
      assert && assert( false, this.formulateAssertionMessage( `value is not a member of EnumerationDeprecated ${valueType}`, message ) );
      return false;
    }
    else if ( typeof valueType === 'function' && !( value instanceof valueType ) ) { // constructor
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value should be instanceof ${valueType.name}, value=${value}`, message ) );
      return false;
    }
    if ( valueType === null && value !== null ) {
      assert && options.assertions && assert( false, this.formulateAssertionMessage( `value should be null, value=${value}`, message ) );
      return false;
    }
    return true;
  }

  static readonly VALIDATOR_KEYS = VALIDATOR_KEYS;

  /**
   * General validator for validating that a string doesn't have template variables in it.
   */
  static readonly STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR: Validator = {
    valueType: 'string',
    isValidValue: v => !/\{\{\w*\}\}/.test( v )
  };
}

/**
 * Validate a type that can be a type, or an array of multiple types.
 */
const validateValueOrElementType = ( type: ValueType, options?: ValidationOptions ): boolean => {
  if ( Array.isArray( type ) ) {

    // If not every type in the list is valid, then return false, pass options through verbatim.
    if ( !_.every( type.map( typeInArray => ValidatorDef.validateValueType( typeInArray, options ) ) ) ) {
      return false;
    }
  }
  else if ( type ) {
    if ( !ValidatorDef.validateValueType( type, options ) ) {
      return false;
    }
  }
  return true;
};


axon.register( 'ValidatorDef', ValidatorDef );
export default ValidatorDef;