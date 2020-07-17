// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Property.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PhetioObjectAPI from '../../tandem/js/PhetioObjectAPI.js';
import merge from '../../phet-core/js/merge.js';
import required from '../../phet-core/js/required.js';
import axon from './axon.js';

class PropertyAPI extends PhetioObjectAPI {

  /**
   * @param {Object} config
   */
  constructor( config ) {

    config = merge( {
      phetioType: required( config.phetioType )
    }, config );

    super( config );
  }
}

axon.register( 'PropertyAPI', PropertyAPI );
export default PropertyAPI;