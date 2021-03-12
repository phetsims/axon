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

const ASSERTIONS_TRUE = { assertions: true };

/**
 * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
 * @param {*} value
 * @param {ValidatorDef} validator
 * @param {Object|string} [optionsOrMessage] - see ValidatorDef.isValueValid() for options, or provide a string as a message instead.
 * @returns {*} - returns the input value for chaining
 * @public
 */
const validate = ( value, validator, optionsOrMessage ) => {

  if ( !assert ) {
    return;
  }

  let options;

  // Support polymorphism to prevent a proliferation of objects being created to house messages to validate().
  if ( typeof optionsOrMessage === 'string' ) {
    options = merge( { message: optionsOrMessage }, ASSERTIONS_TRUE );
  }
  else {
    options = merge( {}, ASSERTIONS_TRUE, optionsOrMessage );
  }


  // Throws an error if not valid
  ValidatorDef.isValueValid( value, validator, options );
};


axon.register( 'validate', validate );
export default validate;