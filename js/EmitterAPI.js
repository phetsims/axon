// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Emitter.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import ActionAPI from './ActionAPI.js';
import axon from './axon.js';
import Emitter from './Emitter.js';

class EmitterAPI extends ActionAPI {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    options = merge( {
      phetioType: Emitter.EmitterIO( [] )
    }, options );
    super( options );
  }
}

axon.register( 'EmitterAPI', EmitterAPI );
export default EmitterAPI;