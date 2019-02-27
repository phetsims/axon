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
   * @param {Object|null} value
   * @param {ValidatorDef} validator
   * @returns {Object|null} - returns the input value for chaining
   * @public
   */
  const validate = ( value, validator ) => {

    if ( assert ) {

      // Throws an error if not valid
      ValidatorDef.isValueValid( value, validator, { assertions: true } );
    }
    return value;
  };

  return axon.register( 'validate', validate );
} );