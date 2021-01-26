// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Property.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import required from '../../phet-core/js/required.js';
import PhetioObjectSpecification from '../../tandem/js/PhetioObjectSpecification.js';
import axon from './axon.js';

class PropertySpecification extends PhetioObjectSpecification {

  /**
   * @param {Property} property
   * @param {Object} config
   */
  constructor( property, config ) {

    config = merge( {
      phetioType: required( config.phetioType )
    }, config );

    super( config );
  }
}

axon.register( 'PropertySpecification', PropertySpecification );
export default PropertySpecification;