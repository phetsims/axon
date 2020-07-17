// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Property.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PhetioObjectAPI from '../../tandem/js/PhetioObjectAPI.js';
import axon from './axon.js';

class PropertyAPI extends PhetioObjectAPI {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    super( options );
  }
}

axon.register( 'PropertyAPI', PropertyAPI );
export default PropertyAPI;