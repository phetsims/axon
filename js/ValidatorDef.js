// Copyright 2018-2019, University of Colorado Boulder

/**
 * Throws assertion errors if a value doesn't match the specified criteria.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  // constants
  const TYPEOF_STRINGS = [ 'string', 'number', 'boolean', 'function' ];

  // constants
  const ASSERTIONS_FALSE = { assertions: false };
  const ASSERTIONS_TRUE = { assertions: true };

  // Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
  // same semantics so that we can use this feature without having extend and allocate new objects at every validation.
  const VALIDATOR_KEYS = [

    // {function|string|null} type of the value.
    // If {function}, the function must be a constructor.
    // If {string}, the string must be one of the primitive types listed in TYPEOF_STRINGS.
    // Unused if null.
    // Examples:
    // valueType: Vector2
    // valueType: 'string'
    // valueType: 'number'
    'valueType',

    // {*[]|null} valid values for this Property. Unused if null.
    // Example:
    // validValues: [ 'horizontal', 'vertical' ]
    'validValues',

    // {function|null} function that validates the value. Single argument is the value, returns boolean. Unused if null.
    // Example:
    // isValidValue: function( value ) { return Util.isInteger( value ) && value >= 0; }
    'isValidValue'

    /**************************************
     * Additionally, validation will always check the validator itself.  However, for types like Property and Emitter,
     * re-checking the validator every time the Property value changes or the Emitter emits wastes time. Hence cases like
     * those can opt-out by specifying:
     *
     * validateOptionsOnValidateValue: false
     *
     * Note: this should not be a key in VALIDATOR_KEYS because the keys are reserved for checking the value itself,
     * see implementation and usage of containsValidatorKey.  Our "definition" of a validator is the makeup of the keys
     * above, validateOptionsOnValidateValue is more of a meta-option that is not for checking the value itself, but
     * whether to check the validator at the same time.
     *********************/
  ];

  const ValidatorDef = {

    /**
     * Throws assertion errors if the validator is invalid.
     * @param {ValidatorDef} validator
     * @param {Object} [options]
     * @returns {boolean}
     * @public
     */
    isValidValidator: ( validator, options ) => {

      options = options || ASSERTIONS_FALSE;// Poor man's extend

      if ( !( validator.hasOwnProperty( 'isValidValue' ) ||
              validator.hasOwnProperty( 'valueType' ) ||
              validator.hasOwnProperty( 'validValues' ) ) ) {
        assert && options.assertions && assert( false, 'validator must have at least one of: isValidValue, valueType, validValues' );
        return false;
      }

      const valueType = validator.valueType;
      if ( !( typeof valueType === 'function' ||
              typeof valueType === 'string' ||
              valueType === null ||
              valueType === undefined ) ) {
        assert && options.assertions && assert( false, `valueType must be {function|string|null}, valueType=${valueType}` );
        return false;
      }

      // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
      if ( typeof valueType === 'string' ) {
        if ( !_.includes( TYPEOF_STRINGS, valueType ) ) {
          assert && options.assertions && assert( false, `valueType not a supported primitive types: ${valueType}` );
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
              assert && options.assertions && assert( false, 'Item not valid: ' + validator.validValues[ i ] );
              return false;
            }
          }
        }
      }
      return true;
    },

    /**
     * Throws assertion errors if the validator is invalid.
     * @param {ValidatorDef} validator
     * @public
     */
    validateValidator: validator => {
      if ( assert ) {

        // Specify that assertions should be thrown if there are problems during the validation check.
        ValidatorDef.isValidValidator( validator, ASSERTIONS_TRUE );
      }
    },

    /**
     * @param {Object} validator - object which may or may not contain validation keys
     * @returns {boolean}
     * @public
     */
    containsValidatorKey( validator ) {

      // TODO: garbage-free implementation, see https://github.com/phetsims/axon/issues/204
      return _.intersection( VALIDATOR_KEYS, Object.keys( validator ) ).length > 0;
    },

    /**
     * Determines whether a value is valid (returning a boolean value), and optionally throws an assertion error if the
     * value is not valid.
     *
     * @param {Object|null} value
     * @param {ValidatorDef} validator
     * @param {Object} [options]
     * @returns {boolean} - whether the value is valid
     * @throws {Error} assertion error if not valid and options.assertions is true
     * @public
     */
    isValueValid( value, validator, options ) {

      options = options || ASSERTIONS_FALSE;

      // Use the same policy for whether to throw assertions when checking the validator itself.
      if ( validator.validateOptionsOnValidateValue !== false && !axon.ValidatorDef.isValidValidator( validator, options ) ) {
        assert && options.assertions && assert( false, 'Invalid validator' );
        return false;
      }

      // See https://github.com/phetsims/axon/issues/201
      if ( validator.valueType ) {
        const valueType = validator.valueType;
        if ( typeof valueType === 'string' && typeof value !== valueType ) { // primitive type
          assert && options.assertions && assert( false, `value should have typeof ${valueType}, value=${value}` );
          return false;
        }
        else if ( valueType === Array && !Array.isArray( value ) ) {
          assert && options.assertions && assert( false, `value should have been an array, value=${value}` );
          return false;
        }
        else if ( typeof valueType === 'function' && !( value instanceof valueType ) ) { // constructor
          assert && options.assertions && assert( false, `value should be instanceof ${valueType.name}, value=${value}` );
          return false;
        }
      }
      if ( validator.validValues && validator.validValues.indexOf( value ) === -1 ) {
        assert && options.assertions && assert( false, `value not in validValues: ${value}` );
        return false;
      }
      if ( validator.isValidValue && !validator.isValidValue( value ) ) {
        assert && options.assertions && assert( false, `value failed isValidValue: ${value}` );
        return false;
      }
      return true;
    }
  };

  ValidatorDef.VALIDATOR_KEYS = VALIDATOR_KEYS;

  return axon.register( 'ValidatorDef', ValidatorDef );
} );