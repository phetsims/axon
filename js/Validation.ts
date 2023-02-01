// Copyright 2019-2023, University of Colorado Boulder

/**
 * The definition file for "validators" used to validate values. This file holds associated logic that validates the
 * schema of the "validator" object, as well as testing if a value adheres to the restrictions provided by a validator.
 * See validate.js for usage with assertions to check that values are valid.
 *
 * Examples:
 *
 * A Validator that only accepts number values:
 * { valueType: 'number' }
 *
 * A Validator that only accepts the numbers "2" or "3":
 * { valueType: 'number', validValues: [ 2, 3 ] }
 *
 * A Validator that accepts any Object:
 * { valueType: Object }
 *
 * A Validator that accepts EnumerationDeprecated values (NOTE! This is deprecated, use the new class-based enumeration pattern as the valueType):
 * { valueType: MyEnumeration }
 * and/or
 * { validValues: MyEnumeration.VALUES }
 *
 * A Validator that accepts a string or a number greater than 2:
 * { isValidValue: value => { typeof value === 'string' || (typeof value === 'number' && value > 2)} }
 *
 * A Validator for a number that should be an even number greater than 10
 * { valueType: 'number', validators: [ { isValidValue: v => v > 10 }, { isValidValue: v => v%2 === 0 }] }
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import optionize from '../../phet-core/js/optionize.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import { ComparableObject } from './TinyProperty.js';

const TYPEOF_STRINGS = [ 'string', 'number', 'boolean', 'function' ];

export type IsValidValueOptions = {

  // By default validation will always check the validity of the  validator itself.  However, for types like
  // Property and Emitter re-checking the validator every time the Property value changes or the Emitter emits
  // wastes cpu. Hence cases like those can opt-out
  validateValidator?: boolean;
};

type ValueType =
  string |
  EnumerationDeprecated |
  null |
  ValueType[] |

  // allow Function here since it is the appropriate level of abstraction for checking instanceof
  Function; // eslint-disable-line @typescript-eslint/ban-types

type ValueComparisonStrategy<T = unknown> = 'equalsFunction' | 'reference' | 'lodashDeep' | ( ( a: T, b: T ) => boolean );

export type Validator<T = unknown> = {

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
  valueType?: ValueType | ValueType[];

  // Valid values for this Property. Unused if null.
  // Example:
  // validValues: [ 'horizontal', 'vertical' ]
  validValues?: readonly T[];

  // equalsFunction -> must have .equals() function on the type T
  valueComparisonStrategy?: ValueComparisonStrategy<T>;

  // Function that validates the value. Single argument is the value, returns boolean. Unused if null.
  // Example:
  // isValidValue: function( value ) { return Number.isInteger( value ) && value >= 0; }
  isValidValue?: ( v: T ) => boolean;

  // A IOType used to specify the public typing for PhET-iO. Each IOType must have a
  // `validator` key specified that can be used for validation. See IOType for an example.
  phetioType?: IOType;

  // if provided, this will provide supplemental information to the assertion/validation messages in addition to the
  // validate-key-specific message that will be given.
  validationMessage?: string;

  // A list of Validator objects, each of which must pass to be a valid value
  validators?: Validator<T>[];
};

// Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
// same semantics so that we can use this feature without having extend and allocate new objects at every validation.
const VALIDATOR_KEYS: Array<keyof Validator> = [
  'valueType',
  'validValues',
  'valueComparisonStrategy',
  'isValidValue',
  'phetioType',
  'validators'
];

export default class Validation {

  /**
   * @returns an error string if incorrect, otherwise null if valid
   */
  public static getValidatorValidationError<T>( validator: Validator<T> ): string | null {

    if ( !( validator instanceof Object ) ) {

      // There won't be a validationMessage on a non-object
      return 'validator must be an Object';
    }

    if ( !( validator.hasOwnProperty( 'isValidValue' ) ||
            validator.hasOwnProperty( 'valueType' ) ||
            validator.hasOwnProperty( 'validValues' ) ||
            validator.hasOwnProperty( 'valueComparisonStrategy' ) ||
            validator.hasOwnProperty( 'phetioType' ) ||
            validator.hasOwnProperty( 'validators' ) ) ) {
      return this.combineErrorMessages( `validator must have at least one of: ${VALIDATOR_KEYS.join( ',' )}`, validator.validationMessage );
    }

    if ( validator.hasOwnProperty( 'valueType' ) ) {
      const valueTypeValidationError = Validation.getValueOrElementTypeValidationError( validator.valueType! );
      if ( valueTypeValidationError ) {
        return this.combineErrorMessages(
          `Invalid valueType: ${validator.valueType}, error: ${valueTypeValidationError}`,
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

    if ( validator.hasOwnProperty( 'valueComparisonStrategy' ) ) {

      // Only accepted values are below
      if ( !( validator.valueComparisonStrategy === 'reference' ||
              validator.valueComparisonStrategy === 'lodashDeep' ||
              validator.valueComparisonStrategy === 'equalsFunction' ||
              typeof validator.isValidValue === 'function' ) ) {
        return this.combineErrorMessages( `valueComparisonStrategy must be "reference", "lodashDeep", 
        "equalsFunction", or a comparison function: ${validator.valueComparisonStrategy}`,
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
      if ( Validation.containsValidatorKey( validatorWithoutValidValues ) ) {
        for ( let i = 0; i < validator.validValues.length; i++ ) {
          const validValue = validator.validValues[ i ];
          const validValueValidationError = Validation.getValidationError( validValue, validatorWithoutValidValues );
          if ( validValueValidationError ) {
            return this.combineErrorMessages(
              `Item not valid in validValues: ${validValue}, error: ${validValueValidationError}`, validator.validationMessage );
          }
        }
      }
    }

    if ( validator.hasOwnProperty( 'phetioType' ) ) {
      if ( !validator.phetioType ) {
        return this.combineErrorMessages( 'falsey phetioType provided', validator.validationMessage );
      }
      if ( !validator.phetioType.validator ) {
        return this.combineErrorMessages( `validator needed for phetioType: ${validator.phetioType.typeName}`,
          validator.validationMessage );
      }

      const phetioTypeValidationError = Validation.getValidatorValidationError( validator.phetioType.validator );
      if ( phetioTypeValidationError ) {
        return this.combineErrorMessages( phetioTypeValidationError, validator.validationMessage );
      }
    }

    if ( validator.hasOwnProperty( 'validators' ) ) {
      const validators = validator.validators!;

      for ( let i = 0; i < validators.length; i++ ) {
        const subValidator = validators[ i ];
        const subValidationError = Validation.getValidatorValidationError( subValidator );
        if ( subValidationError ) {
          return this.combineErrorMessages( `validators[${i}] invalid: ${subValidationError}`, validator.validationMessage );
        }
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

  public static validateValidator<T>( validator: Validator<T> ): void {
    if ( assert ) {
      const error = Validation.getValidatorValidationError( validator );
      error && assert( false, error );
    }
  }

  /**
   * @param validator - object which may or may not contain validation keys
   */
  public static containsValidatorKey( validator: IntentionalAny ): boolean {
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

  public static isValueValid<T>( value: T, validator: Validator<T>, providedOptions?: IsValidValueOptions ): boolean {
    return this.getValidationError( value, validator, providedOptions ) === null;
  }

  /**
   * Determines whether a value is valid (returning a boolean value), returning the problem as a string if invalid,
   * otherwise returning null when valid.
   */
  public static getValidationError<T>( value: IntentionalAny, validator: Validator<T>, providedOptions?: IsValidValueOptions ): string | null {

    const options = optionize<IsValidValueOptions>()( {
      validateValidator: true
    }, providedOptions );

    if ( options.validateValidator ) {
      const validatorValidationError = Validation.getValidatorValidationError( validator );
      if ( validatorValidationError ) {
        return validatorValidationError;
      }
    }

    // Check valueType, which can be an array, string, type, or null
    if ( validator.hasOwnProperty( 'valueType' ) ) {
      const valueType = validator.valueType;
      if ( Array.isArray( valueType ) ) {

        // Only one should be valid, so error out if none of them returned valid (valid=null)
        if ( !_.some( valueType.map( ( typeInArray: ValueType ) => !Validation.getValueTypeValidationError( value, typeInArray, validator.validationMessage ) ) ) ) {
          return this.combineErrorMessages(
            `value not valid for any valueType in ${valueType.toString().substring( 0, 100 )}, value: ${value}`,
            validator.validationMessage );
        }
      }
      else if ( valueType ) {

        const valueTypeValidationError = Validation.getValueTypeValidationError( value, valueType, validator.validationMessage );
        if ( valueTypeValidationError ) {

          // getValueTypeValidationError will add the validationMessage for us
          return valueTypeValidationError;
        }
      }
    }

    if ( validator.validValues ) {

      const valueComparisonStrategy: ValueComparisonStrategy<T> = validator.valueComparisonStrategy || 'reference';
      const valueValid = validator.validValues.some( validValue => {

        if ( valueComparisonStrategy === 'reference' ) {
          return validValue === value;
        }
        if ( valueComparisonStrategy === 'equalsFunction' ) {
          const validComparable = validValue as ComparableObject;
          assert && assert( !!validComparable.equals, 'no equals function for 1st arg' );
          assert && assert( !!value.equals, 'no equals function for 2nd arg' );
          assert && assert( validComparable.equals( value ) === value.equals( validComparable ), 'incompatible equality checks' );

          return validComparable.equals( value );
        }
        if ( valueComparisonStrategy === 'lodashDeep' ) {
          return _.isEqual( validValue, value );
        }
        else {
          return valueComparisonStrategy( validValue, value );
        }
      } );

      if ( !valueValid ) {
        return this.combineErrorMessages( `value not in validValues: ${value}`, validator.validationMessage );
      }
    }
    if ( validator.hasOwnProperty( 'isValidValue' ) && !validator.isValidValue!( value ) ) {
      return this.combineErrorMessages( `value failed isValidValue: ${value}`, validator.validationMessage );
    }
    if ( validator.hasOwnProperty( 'phetioType' ) ) {

      const phetioTypeValidationError = Validation.getValidationError( value, validator.phetioType!.validator, options );
      if ( phetioTypeValidationError ) {
        return this.combineErrorMessages( `value failed phetioType validator: ${value}, error: ${phetioTypeValidationError}`, validator.validationMessage );
      }
    }

    if ( validator.hasOwnProperty( 'validators' ) ) {
      const validators = validator.validators!;

      for ( let i = 0; i < validators.length; i++ ) {
        const subValidator = validators[ i ];
        const subValidationError = Validation.getValidationError( value, subValidator, options );
        if ( subValidationError ) {
          return this.combineErrorMessages( `Failed validation for validators[${i}]: ${subValidationError}`, validator.validationMessage );
        }
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
        const error = Validation.getValueTypeValidatorValidationError( typeElement );
        if ( error ) {
          return `Array value invalid: ${error}`;
        }
      }
    }
    else if ( type ) {
      const error = Validation.getValueTypeValidatorValidationError( type );
      if ( error ) {
        return `Value type invalid: ${error}`;
      }
    }
    return null;
  }


  public static readonly VALIDATOR_KEYS = VALIDATOR_KEYS;

  /**
   * General validator for validating that a string doesn't have template variables in it.
   */
  public static readonly STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR: Validator<string> = {
    valueType: 'string',
    isValidValue: v => !/\{\{\w*\}\}/.test( v )
  };
}

axon.register( 'Validation', Validation );
