// Copyright 2019-2022, University of Colorado Boulder

// @ts-nocheck

/**
 * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ValidatorDef, { IsValidValueOptions, Validator } from './ValidatorDef.js';

/**
 * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
 * @param value
 * @param validator - provide a validationMessage to provide extra context to the validation
 * @param [providedOptions] - see ValidatorDef.isValueValid() for options
 */
const validate = ( value: IntentionalAny, validator: Validator, providedOptions?: IsValidValueOptions ): void => {

  if ( assert ) {

    // Throws an error if not valid
    const result = ValidatorDef.getValidationError( value, validator, providedOptions );
    if ( result ) {
      const prunedValidator = _.pick( validator, ValidatorDef.VALIDATOR_KEYS );
      assert && assert( false, 'validation failed:', result, 'prunedValidator:', prunedValidator );
    }
  }
};


axon.register( 'validate', validate );
export default validate;