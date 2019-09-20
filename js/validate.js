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
  const ValidatorDef = require( 'AXON/ValidatorDef' );

  /**
   * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
   * @param {*} value
   * @param {ValidatorDef} validator
   * @param {Object} [options] - see ValidatorDef.isValueValid()
   * @returns {*} - returns the input value for chaining
   * @public
   */
  const validate = ( value, validator, options ) => {

    if ( assert ) {

      // Throws an error if not valid
      ValidatorDef.isValueValid( value, validator, _.extend( { assertions: true }, options ) );
    }
    return value;
  };

  /**
   * validate that the input is a string without any unfilled template variables, like `{{myVar}}`.
   * @param {*} value to be validated
   * @returns {*} - returns the input value for chaining
   */
  validate.stringWithoutTemplateVars = value => {
    return validate( value, {
      valueType: 'string',
      isValidValue: v => !/\{\{\w*\}\}/.test( v )
    } );
  };

  return axon.register( 'validate', validate );
} );