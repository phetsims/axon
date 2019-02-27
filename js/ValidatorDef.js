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
  const validate = require( 'AXON/validate' );

  // constants
  const TYPEOF_STRINGS = [ 'string', 'number', 'boolean', 'function' ];

  // Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
  // same semantics so that we can use this feature without having extend and allocate new objects at every validation.
  const DEFAULT_OPTIONS = {

    // {function|string|null} type of the value.
    // If {function}, the function must be a constructor.
    // If {string}, the string must be one of the primitive types listed in TYPEOF_STRINGS.
    // Unused if null.
    // Examples:
    // valueType: Vector2
    // valueType: 'string'
    // valueType: 'number'
    valueType: null,

    // {*[]|null} valid values for this Property. Unused if null.
    // Example:
    // validValues: [ 'horizontal', 'vertical' ]
    validValues: null,

    // {function|null} function that validates the value. Single argument is the value, returns boolean. Unused if null.
    // Example:
    // isValidValue: function( value ) { return Util.isInteger( value ) && value >= 0; }
    isValidValue: null,

    // By default, always check the provided options.  Can be turned off for cases where the same options are used
    // repeatedly, such as in Property
    validateOptionsOnValidateValue: true
  };

  const ValidatorDef = {

    /**
     * Throws assertion errors if the validator is invalid.
     * @param {Object} validator
     * @public
     */
    validateValidator: validator => {
      if ( assert ) {

        assert(
          validator.hasOwnProperty( 'isValidValue' ) ||
          validator.hasOwnProperty( 'valueType' ) ||
          validator.hasOwnProperty( 'validValues' ),
          'validator must have at least one of: isValidValue, valueType, validValues'
        );

        const valueType = validator.valueType;
        assert(
          typeof valueType === 'function' ||
          typeof valueType === 'string' ||
          valueType === null ||
          valueType === undefined,
          `valueType must be {function|string|null}, valueType=${valueType}`
        );

        // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
        if ( typeof valueType === 'string' ) {
          assert( _.includes( TYPEOF_STRINGS, valueType ), `valueType not a supported primitive types: ${valueType}` );
        }

        if ( validator.hasOwnProperty( 'isValidValue' ) ) {
          assert(
            typeof validator.isValidValue === 'function' ||
            validator.isValidValue === null ||
            validator.isValidValue === undefined,
            `isValidValue must be a function: ${validator.isValidValue}`
          );
        }

        if ( validator.validValues !== undefined && validator.validValues !== null ) {
          assert( Array.isArray( validator.validValues ), `validValues must be an array: ${validator.validValues}` );

          // Make sure each initial value is valid.
          const remainingValidatorFields = _.omit( validator, 'validValues' );
          validator.validValues.forEach( v => validate( v, remainingValidatorFields ) );
        }
      }
      else {
        return true;
      }
    }
  };

  ValidatorDef.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

  return axon.register( 'ValidatorDef', ValidatorDef );
} );