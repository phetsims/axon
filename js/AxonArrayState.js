// Copyright 2020, University of Colorado Boulder

import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import axon from './axon.js';
import AxonArrayStateIO from './AxonArrayStateIO.js';

/**
 * Manages state save/load for AxonArray.  AxonArray extends Array and hence cannot be instrumented.  This type
 * provides that functionality.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
class AxonArrayState extends PhetioObject {

  /**
   * @param {AxonArray} axonArray
   * @param {Object} [options] - same as the options to the parent AxonArray
   */
  constructor( axonArray, options ) {
    options = merge( {
      phetioType: AxonArrayStateIO
    }, options );
    super( options );

    // @private
    this.axonArray = axonArray;
  }

  // @public
  toStateObject() {
    return {
      array: this.axonArray.map( item => this.axonArray.phetioElementType.toStateObject( item ) )
    };
  }

  // @public
  applyState( stateObject ) {
    this.axonArray.clear();
    const elements = stateObject.array.map( paramStateObject => this.axonArray.phetioElementType.fromStateObject( paramStateObject ) );
    this.axonArray.addAll( elements );
  }
}

axon.register( 'AxonArrayState', AxonArrayState );
export default AxonArrayState;