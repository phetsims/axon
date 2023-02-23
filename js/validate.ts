// Copyright 2019-2023, University of Colorado Boulder

/**
 * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import Validation, { IsValidValueOptions, Validator } from './Validation.js';

/**
 * If assertions are enabled, assert out if the value does not adhere to the validator. No-op without assertions.
 * @deprecated - this solution is worse than a direct assertion (or otherwise call Validation.getValidationError directly)
 */
const validate = <T>( value: IntentionalAny, validator: Validator<T>, providedOptions?: IsValidValueOptions ): void => {

  if ( assert ) {

    // Throws an error if not valid
    const result = Validation.getValidationError( value, validator, providedOptions );
    if ( result ) {
      const prunedValidator = _.pick( validator, Validation.VALIDATOR_KEYS );
      assert && assert( false, 'validation failed:', result, 'prunedValidator:', prunedValidator );
    }
  }
};


axon.register( 'validate', validate );
export default validate;