// Copyright 2020-2021, University of Colorado Boulder

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

    options = merge( {
      phetioDocumentation: 'Determines whether the element is enabled (true) or disabled (false).',
      phetioFeatured: true,

      // by default, the tandem name must match. In rare occurrences (such as when one model must have 2 separate
      // EnabledProperties, like this.mass1EnabledProperty = ..., this.mass2EnabledProperty = ...
      // you can opt out of the name check. This should be used sparingly. For instance, for the example above, it may
      // be better to do this.mass1.enabledProperty anyways.
      checkTandemName: true
    }, options );

    if ( assert && options && options.tandem && options.tandem.supplied && options.checkTandemName ) {
      assert && assert( options.tandem.name === TANDEM_NAME, `EnabledProperty tandems should be named ${TANDEM_NAME}` );
    }

    super( initialEnabled, options );
  }

  /**
   * @public
   * @returns {string}
   */
  static get TANDEM_NAME() { return TANDEM_NAME; }
}

axon.register( 'EnabledProperty', EnabledProperty );
export default EnabledProperty;