// Copyright 2019-2022, University of Colorado Boulder

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
const ARRAY_VALIDATOR = { valueType: Array, validationMessage: 'Should be an Array' };

export type IsValidValueOptions = {

  // By default validation will always check the validity of the  validator itself.  However, for types like
  // Property and Emitter re-checking the validator every time the Property value changes or the Emitter emits
  // wastes cpu. Hence cases like those can opt-out
  validateValidator?: boolean;
};

type ValueType = string | Constructor | EnumerationDeprecated | null | ValueType[];
export type Validator<T = any> = {
  valueType?: ValueType | ValueType[];
  validValues?: readonly T[];
  isValidValue?: ( v?: any ) => boolean;
  arrayElementType?: ValueType;
  phetioType?: IOType;

  // if provided, this will provide supplemental information to the assertion/validation messages in addition to the
  // validate-key-specific message that will be given.
  validationMessage?: string;
}

// Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
// same semantics so that we can use this feature without having extend and allocate new objects at every validation.
const VALIDATOR_KEYS: Array<keyof Validator> = [
  // Type of the value.
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

  // Valid values for this Property. Unused if null.
  // Example:
  // validValues: [ 'horizontal', 'vertical' ]
  'validValues',

  // Function that validates the value. Single argument is the value, returns boolean. Unused if null.
  // Example:
  // isValidValue: function( value ) { return Number.isInteger( value ) && value >= 0; }
  'isValidValue',

  // This option takes the same types as are supported with `valueType`. This option is to specify the type of the
  // elements of an array. For this option to valid, `valueType` must either be omitted, or be `Array`. It is assumed that
  // valueType is `Array`.
  'arrayElementType',

  // A IOType used to specify the public typing for PhET-iO. Each IOType must have a
  // `validator` key specified that can be used for validation. See IOType for an example.
  'phetioType'
];

export default class ValidatorDef {

  /**
   * @returns an error string if incorrect, otherwise null if valid
   */
  static getValidatorValidationError( validator: Validator ): string | null {

    if ( !( validator instanceof Object ) ) {

      // There won't be a validationMessage on a non-object
      return 'validator must be an Object';
    }
    if ( !( validator.hasOwnProperty( 'isValidValue' ) ||
            validator.hasOwnProperty( 'valueType' ) ||
            validator.hasOwnProperty( 'arrayElementType' ) ||
            validator.hasOwnProperty( 'validValues' ) ||
            validator.hasOwnProperty( 'phetioType' ) ) ) {
      return this.combineErrorMessages( 'validator must have at least one of: isValidValue, valueType, validValues, phetioType, arrayElementType', validator.validationMessage );
    }

    if ( validator.hasOwnProperty( 'valueType' ) ) {
      const valueTypeValidationError = ValidatorDef.getValueOrElementTypeValidationError( validator.valueType! );
      if ( valueTypeValidationError ) {
        return this.combineErrorMessages(
          `Invalid valueType: ${validator.valueType}, error: ${valueTypeValidationError}`,
          validator.validationMessage );
      }
    }

    if ( validator.hasOwnProperty( 'arrayElementType' ) ) {
      if ( validator.hasOwnProperty( 'valueType' ) && validator.valueType !== Array ) {
        return this.combineErrorMessages( 'valueType must be "Array" when specified with arrayElementType.',
          validator.validationMessage );

      }
      const arrayElementTypeError = ValidatorDef.getValueOrElementTypeValidationError( validator.arrayElementType! );
      if ( arrayElementTypeError ) {
        return this.combineErrorMessages( `Invalid arrayElementType: ${arrayElementTypeError}`,
          validator.validationMessage );
      }
    }

    if ( validator.hasOwnProperty( 'isValidValue' ) ) {
      if ( !( typeof validator.isValidValue === 'function' ||
              validator.isValidValue === null ||
              validator.isValidValue === undefined ) ) {
        return this.combineErrorMessages( `isValidValue must be a function: ${validator.isValidValue}`,
          validator.validationMessage );
      }
    }

    if ( validator.validValues !== undefined && validator.validValues !== null ) {
      if ( !Array.isArray( validator.validValues ) ) {
        return this.combineErrorMessages( `validValues must be an array: ${validator.validValues}`,
          validator.validationMessage );
      }

      // Make sure each validValue matches the other rules, if any.
      const validatorWithoutValidValues = _.omit( validator, 'validValues' );
      if ( ValidatorDef.containsValidatorKey( validatorWithoutValidValues ) ) {
        for ( let i = 0; i < validator.validValues.length; i++ ) {
          const validValueValidationError = ValidatorDef.getValidationError( validator.validValues[ i ], validatorWithoutValidValues );
          if ( validValueValidationError ) {
            return `Item not valid in validValues: ${validator.validValues[ i ]}, error: ${validValueValidationError}`;
          }
        }
      }
    }

    if ( validator.hasOwnProperty( 'phetioType' ) ) {
      if ( !validator.phetioType ) {
        return this.combineErrorMessages( 'falsey phetioType provided', validator.validationMessage );
      }
      if ( !validator.phetioType.validator ) {
        return this.combineErrorMessages( `validator needed for phetioType: ${validator.phetioType!.typeName}`,
          validator.validationMessage );
      }

      // @ts-ignore - until phetioType is in TypeScript
      const phetioTypeValidationError = ValidatorDef.getValidatorValidationError( validator.phetioType.validator );
      if ( phetioTypeValidationError ) {
        return this.combineErrorMessages( phetioTypeValidationError, validator.validationMessage );
      }
    }
    return null;
  }

  /**
   * Validate that the valueType is of the expected format. Does not add validationMessage to any error it reports.
   * @returns - null if valid
   */
  private static getValueTypeValidatorValidationError( valueType: ValueType ): string | null {
    if ( !( typeof valueType === 'function' ||
            typeof valueType === 'string' ||
            valueType instanceof EnumerationDeprecated ||
            valueType === null ||
            valueType === undefined ) ) {
      return `valueType must be {function|string|EnumerationDeprecated|null|undefined}, valueType=${valueType}`;
    }

    // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
    if ( typeof valueType === 'string' ) {
      if ( !_.includes( TYPEOF_STRINGS, valueType ) ) {
        return `valueType not a supported primitive types: ${valueType}`;
      }
    }
    return null;
  }

  static validateValidator( validator: Validator ): void {
    if ( assert ) {
      const error = ValidatorDef.getValidatorValidationError( validator );
      error && assert( false, error );
    }
  }

  /**
   * @param validator - object which may or may not contain validation keys
   */
  static containsValidatorKey( validator: IntentionalAny ): boolean {
    if ( !( validator instanceof Object ) ) {
      return false;
    }
    for ( let i = 0; i < VALIDATOR_KEYS.length; i++ ) {
      if ( validator.hasOwnProperty( VALIDATOR_KEYS[ i ] ) ) {
        return true;
      }
    }
    return false;
  }

  private static combineErrorMessages( genericMessage: string, specificMessage?: string ): string {
    if ( specificMessage ) {
      genericMessage = `${specificMessage}: ${genericMessage}`;
    }
    return genericMessage;
  }

  static isValueValid( value: IntentionalAny, validator: Validator, providedOptions?: IsValidValueOptions ): boolean {
    return this.getValidationError( value, validator, providedOptions ) === null;
  }

  /**
   * Determines whether a value is valid (returning a boolean value), returning the problem as a string if invalid,
   * otherwise returning null when valid.
   */
  static getValidationError( value: IntentionalAny, validator: Validator, providedOptions?: IsValidValueOptions ): string | null {

    const options = optionize<IsValidValueOptions>()( {
      validateValidator: true
    }, providedOptions );

    if ( options.validateValidator ) {
      const validatorValidationError = ValidatorDef.getValidatorValidationError( validator );
      if ( validatorValidationError ) {
        return validatorValidationError;
      }
    }

    // Check valueType, which can be an array, string, type, or null
    if ( validator.hasOwnProperty( 'valueType' ) ) {
      const valueType = validator.valueType;
      if ( Array.isArray( valueType ) ) {

        // Only one should be valid, so error out if none of them returned valid (valid=null)
        if ( !_.some( valueType.map( ( typeInArray: ValueType ) => !ValidatorDef.getValueTypeValidationError( value, typeInArray, validator.validationMessage ) ) ) ) {
          return this.combineErrorMessages(
            `value not valid for any valueType in ${valueType.toString().substring( 0, 100 )}, value: ${value}`,
            validator.validationMessage );
        }
      }
      else if ( valueType ) {

        const valueTypeValidationError = ValidatorDef.getValueTypeValidationError( value, valueType, validator.validationMessage );
        if ( valueTypeValidationError ) {

          // getValueTypeValidationError will add the validationMessage for us
          return valueTypeValidationError;
        }
      }
    }

    if ( validator.hasOwnProperty( 'arrayElementType' ) ) {
      const arrayElementType = validator.arrayElementType;

      // If using arrayElementType, then the value should be an array.
      const arrayValidationError = ValidatorDef.getValidationError( value, ARRAY_VALIDATOR, options );
      if ( arrayValidationError ) {
        return this.combineErrorMessages( arrayValidationError, validator.validationMessage );
      }

      for ( let i = 0; i < value.length; i++ ) {
        const arrayElement = value[ i ];

        // if the type is an array, then handle it like we did for valueType, with _.some
        if ( Array.isArray( arrayElementType ) ) {

          // If none of the elements return null, then the value type is invalid
          if ( !_.some( arrayElementType.map( typeInArray => !ValidatorDef.getValueTypeValidationError( arrayElement, typeInArray ) ) ) ) {
            return this.combineErrorMessages( `array element not valid for any arrayElementType in ${arrayElementType}, value: ${arrayElement}`, validator.validationMessage );
          }
        }
        else {

          // if not an array, then just check the array element
          const arrayElementValidationError = ValidatorDef.getValueTypeValidationError( arrayElement, validator.arrayElementType!, validator.validationMessage );
          if ( arrayElementValidationError ) {

            // getValueTypeValidationError will add the validationMessage for us
            return arrayElementValidationError;
          }
        }
      }
    }

    if ( validator.hasOwnProperty( 'validValues' ) && validator.validValues!.indexOf( value ) === -1 ) {
      return this.combineErrorMessages( `value not in validValues: ${value}`, validator.validationMessage );
    }
    if ( validator.hasOwnProperty( 'isValidValue' ) && !validator.isValidValue!( value ) ) {
      return this.combineErrorMessages( `value failed isValidValue: ${value}`, validator.validationMessage );
    }
    if ( validator.hasOwnProperty( 'phetioType' ) ) {

      // @ts-ignore - until phetioType is in TypeScript
      const phetioTypeValidationError = ValidatorDef.getValidationError( value, validator.phetioType!.validator );
      if ( phetioTypeValidationError ) {
        return this.combineErrorMessages( `value failed phetioType validator: ${value}, error: ${phetioTypeValidationError}`, validator.validationMessage );
      }
    }
    return null;
  }

  private static getValueTypeValidationError( value: IntentionalAny, valueType: ValueType, message?: string ): string | null {
    if ( typeof valueType === 'string' && typeof value !== valueType ) { // primitive type
      return this.combineErrorMessages( `value should have typeof ${valueType}, value=${value}`, message );
    }
    else if ( valueType === Array && !Array.isArray( value ) ) {
      return this.combineErrorMessages( `value should have been an array, value=${value}`, message );
    }
    else if ( valueType instanceof EnumerationDeprecated && !valueType.includes( value ) ) {
      return this.combineErrorMessages( `value is not a member of EnumerationDeprecated ${valueType}`, message );
    }
    else if ( typeof valueType === 'function' && !( value instanceof valueType ) ) { // constructor
      return this.combineErrorMessages( `value should be instanceof ${valueType.name}, value=${value}`, message );
    }
    if ( valueType === null && value !== null ) {
      return this.combineErrorMessages( `value should be null, value=${value}`, message );
    }
    return null;
  }

  /**
   * Validate a type that can be a type, or an array of multiple types. Does not add validationMessage to any error
   * it reports
   */
  private static getValueOrElementTypeValidationError( type: ValueType ): string | null {
    if ( Array.isArray( type ) ) {

      // If not every type in the list is valid, then return false, pass options through verbatim.
      for ( let i = 0; i < type.length; i++ ) {
        const typeElement = type[ i ];
        const error = ValidatorDef.getValueTypeValidatorValidationError( typeElement );
        if ( error ) {
          return `Array value invalid: ${error}`;
        }
      }
    }
    else if ( type ) {
      const error = ValidatorDef.getValueTypeValidatorValidationError( type );
      if ( error ) {
        return `Value type invalid: ${error}`;
      }
    }
    return null;
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

axon.register( 'ValidatorDef', ValidatorDef );
