// Copyright 2019-2020, University of Colorado Boulder

/**
 * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import axon from './axon.js';
import ValidatorDef from './ValidatorDef.js';

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
    ValidatorDef.isValueValid( value, validator, merge( { assertions: true }, options ) );
  }
  return value;
};


axon.register( 'validate', validate );
export default validate;