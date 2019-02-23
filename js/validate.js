// Copyright 2019, University of Colorado Boulder

/**
 * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  /**
   * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
   * @param {Object|null} value
   * @param {Object} [validator]
   * @returns {Object|null} - returns the value for chaining
   * @public
   */
  const validate = ( value, validator ) => {

    if ( assert ) {

      // validate validator, but allow opting out for improved performance for repeat cases like Property
      validator.validateOptionsOnValidateValue && axon.ValidatorDef.validateValidator( validator );

      // See https://github.com/phetsims/axon/issues/201
      if ( validator.valueType ) {
        const valueType = validator.valueType;
        if ( typeof valueType === 'string' ) { // primitive type
          assert( typeof value === valueType, `value should have typeof ${valueType}, value=${value}` );
        }
        else if ( typeof valueType === 'function' ) { // constructor
          assert( value instanceof valueType, `value should be instanceof ${valueType.name}, value=${value}` );
        }
        else if ( valueType === Array ) {
          assert( Array.isArray( value ), `value should have been an array, value=${value}` );
        }
      }
      validator.validValues && assert( validator.validValues.indexOf( value ) >= 0, `value not in validValues: ${value}` );
      validator.isValidValue && assert( validator.isValidValue( value ), `value failed isValidValue: ${value}` );

      // Passed all tests, so it is a valid value.
      return value;
    }
    else {

      // asserts are not enabled, so any value is valid
      return value;
    }
  };

  return axon.register( 'validate', validate );
} );