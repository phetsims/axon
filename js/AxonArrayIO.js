// Copyright 2020, University of Colorado Boulder

import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import axon from './axon.js';
import AxonArray from './AxonArray.js';
import validate from './validate.js';

/**
 * AxonArrayIO is the IO Type for AxonArray. It delegates most of its implementation to AxonArray.
 * Instead of being a parametric type, it leverages the phetioElementType on AxonArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

class AxonArrayIO extends ObjectIO {

  // @public
  static toStateObject( axonArrayPhetioObject ) {
    validate( axonArrayPhetioObject, this.validator );
    return axonArrayPhetioObject.axonArray.toStateObject();
  }

// @public
  static stateToArgsForConstructor( state ) {
    return AxonArray.stateToArgsForConstructor( state );
  }

  // @public
  static applyState( axonArrayPhetioObject, state ) {
    axonArrayPhetioObject.axonArray.applyState( state );
  }
}

AxonArrayIO.documentation = 'IO Type for AxonArray';
AxonArrayIO.validator = { isValidValue: value => value instanceof AxonArray.AxonArrayPhetioObject };
AxonArrayIO.typeName = 'AxonArrayIO';
ObjectIO.validateIOType( AxonArrayIO );

axon.register( 'AxonArrayIO', AxonArrayIO );
export default AxonArrayIO;