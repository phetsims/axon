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
    if ( assert && options && options.tandem ) {
      assert && assert( options.tandem.name === TANDEM_NAME, `EnabledProperty tandems should be named ${TANDEM_NAME}` );
    }

    super( initialEnabled, merge( {
      phetioDocumentation: 'Whether this component is interactive. When disabled, the component cannot be interacted with and is often visually grayed out.',
      phetioFeatured: true
    }, options ) );
  }

  /**
   * @public
   * @returns {string}
   */
  static get TANDEM_NAME() { return TANDEM_NAME; }
}

axon.register( 'EnabledProperty', EnabledProperty );
export default EnabledProperty;