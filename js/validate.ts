// Copyright 2019-2022, University of Colorado Boulder

// @ts-nocheck

/**
 * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import optionize from '../../phet-core/js/optionize.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ValidatorDef, { IsValidValueOptions, Validator } from './ValidatorDef.js';

/**
 * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
 * @param value
 * @param validator - ValidatorDef
 * @param [message] - make this an arg, instead of an option, for convenience. This message will be prepended to
 * a message in ValidatorDef that specifies which validator key fails, along with the value. It is best to end this
 * message with no punctuation.
 * @param [providedOptions] - see ValidatorDef.isValueValid() for options
 */
const validate = ( value: IntentionalAny, validator: Validator, message?: string, providedOptions?: IsValidValueOptions ): void => {

  if ( assert ) {
    providedOptions && assert( !providedOptions.hasOwnProperty( message ), 'prefer parameter to options for message' );

    const options = optionize<IsValidValueOptions, {}>()( {

      // TODO: support this message https://github.com/phetsims/studio/issues/253
      message: message // use a parameter and merge it in here for convenience
    }, providedOptions );

    // Throws an error if not valid
    const result = ValidatorDef.getValidationError( value, validator, options );
    if ( result ) {

      const prunedValidator = _.pick( validator, ValidatorDef.VALIDATOR_KEYS );
      assert && assert( false, 'validation failed: ', result, 'prunedValidator', prunedValidator );
    }
  }
};


axon.register( 'validate', validate );
export default validate;