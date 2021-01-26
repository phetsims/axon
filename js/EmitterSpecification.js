// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Emitter.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import ActionSpecification from './ActionSpecification.js';
import axon from './axon.js';
import Emitter from './Emitter.js';

class EmitterSpecification extends ActionSpecification {

  /**
   * @param {Emitter} emitter
   * @param {Object} [options]
   */
  constructor( emitter, options ) {
    options = merge( {
      phetioType: Emitter.EmitterIO( [] )
    }, options );
    super( options );
  }
}

axon.register( 'EmitterSpecification', EmitterSpecification );
export default EmitterSpecification;