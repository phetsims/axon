// Copyright 2020, University of Colorado Boulder

/**
 * PhET-iO API type for Action.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import PhetioObjectAPI from '../../tandem/js/PhetioObjectAPI.js';
import Action from './Action.js';
import axon from './axon.js';

class ActionAPI extends PhetioObjectAPI {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    options = merge( {
      phetioType: Action.createActionIO( [] ),
      phetioState: false
    }, options );
    super( options );
  }
}

axon.register( 'ActionAPI', ActionAPI );
export default ActionAPI;