// Copyright 2020, University of Colorado Boulder

import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import AxonArrayState from './AxonArrayState.js';
import validate from './validate.js';
import axon from './axon.js';

/**
 * AxonArrayStateIO is the IO Type for AxonArrayState. It delegates most of its implementation to AxonArrayState.
 * Instead of being a parametric type, it leverages the phetioElementType on AxonArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

class AxonArrayStateIO extends ObjectIO {

  // @public
  static toStateObject( axonArray ) {
    validate( axonArray, this.validator );
    return axonArray.toStateObject();
  }

// @public
  static stateToArgsForConstructor( state ) {
    return AxonArrayState.stateToArgsForConstructor( state );
  }

  // @public
  static applyState( axonArrayState, state ) {
    axonArrayState.applyState( state );
  }
}

AxonArrayStateIO.documentation = 'IO Type for AxonArrayState';
AxonArrayStateIO.validator = { isValidValue: value => value instanceof AxonArrayState };
AxonArrayStateIO.typeName = 'AxonArrayStateIO';
ObjectIO.validateSubtype( AxonArrayStateIO );

axon.register( 'AxonArrayStateIO', AxonArrayStateIO );
export default AxonArrayStateIO;