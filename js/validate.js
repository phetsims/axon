// Copyright 2019-2021, University of Colorado Boulder

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
 * @param {string} [message] - make this an arg, instead of an option, for convenience. This message will be prepended to
 * a message in ValidatorDef that specifies which validator key fails, along with the value. It is best to end this
 * message with no punctuation.
 * @param {Object} [options] - see ValidatorDef.isValueValid() for options
 * @returns {*} - returns the input value for chaining
 * @public
 */
const validate = ( value, validator, message, options ) => {

  if ( assert ) {
    options && assert( !options.hasOwnProperty( message ), 'prefer parameter to options for message' );

    options = merge( {
      assertions: true,
      message: message // use a parameter and merge it in here for convenience
    }, options );

    // Throws an error if not valid
    ValidatorDef.isValueValid( value, validator, options );
  }
};


axon.register( 'validate', validate );
export default validate;