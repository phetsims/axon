// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Action.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import PhetioObjectSpecification from '../../tandem/js/PhetioObjectSpecification.js';
import Action from './Action.js';
import axon from './axon.js';

class ActionSpecification extends PhetioObjectSpecification {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    options = merge( {
      phetioType: Action.ActionIO( [] ),
      phetioState: false
    }, options );
    super( options );
  }
}

axon.register( 'ActionSpecification', ActionSpecification );
export default ActionSpecification;