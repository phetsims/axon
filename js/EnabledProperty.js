// Copyright 2020, University of Colorado Boulder

/**
 * Property to control the enabled of something. In general this should never be called by clients, but instead is factored
 * out for consistency in PhET libraries. This serves as the default Property to control enabled with PhET-iO instrumentation
 *
 * @author Michael Kauzmann(PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import axon from './axon.js';
import BooleanProperty from './BooleanProperty.js';

const TANDEM_NAME = 'enabledProperty';

class EnabledProperty extends BooleanProperty {

  /**
   * @param {boolean} initialEnabled
   * @param {Object} [options]
   */
  constructor( initialEnabled, options ) {
    super( initialEnabled, merge( {
      tandem: options.tandem.createTandem( TANDEM_NAME ),
      phetioDocumentation: 'When disabled, the component is grayed out and cannot be interacted with.',
      phetioFeatured: true
    }, options ) );
  }

  /**
   * @public
   * @returns {string}
   */
  static get TANDEM_NAME() { return TANDEM_NAME;}
}

axon.register( 'EnabledProperty', EnabledProperty );
export default EnabledProperty;