// Copyright 2021, University of Colorado Boulder

/**
 * Base class that defines a settable Property that determines whether the Object is enabled or not. This includes
 * support for phet-io instrumentation and a variety of options to customize the enabled Property as well as how it is
 * created.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import EnabledProperty from './EnabledProperty.js';
import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';

// constants
const DEFAULT_OPTIONS = {

  // {Property.<boolean>} if not provided, a Property will be created
  enabledProperty: null,

  // {boolean} initial value of enabledProperty if we create it, ignored if enabledProperty is provided
  enabled: true,

  // {Object|null} options to enabledProperty if we create it, ignored if enabledProperty is provided
  enabledPropertyOptions: null,

  // {boolean} - Whether or not the default-created enabledProperty should be instrumented for PhET-iO. Ignored if
  // options.enabledProperty is provided.
  phetioEnabledPropertyInstrumented: true,

  // phet-io
  tandem: Tandem.OPTIONAL
};

class EnabledComponent {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    options = merge( {}, DEFAULT_OPTIONS, options );

    const ownsEnabledProperty = !options.enabledProperty;

    assert && options.enabledPropertyOptions && assert( !( !options.phetioEnabledPropertyInstrumented && options.enabledPropertyOptions.tandem ),
      'incompatible options. Cannot specify phetioEnabledPropertyInstrumented opt out and a Tandem via enabledPropertyOptions.' );

    // @public
    this.enabledProperty = options.enabledProperty || new EnabledProperty( options.enabled, merge( {
      tandem: options.phetioEnabledPropertyInstrumented ? options.tandem.createTandem( EnabledProperty.TANDEM_NAME ) : Tandem.OPT_OUT
    }, options.enabledPropertyOptions ) );

    // @private - called by dispose
    this.disposeEnabledComponent = () => {
      ownsEnabledProperty && this.enabledProperty.dispose();
    };
  }

  /**
   * @public
   * @param {boolean} enabled
   */
  setEnabled( enabled ) { this.enabledProperty.value = enabled; }

  // @public
  set enabled( value ) { this.setEnabled( value ); }

  /**
   * @public
   * @returns {boolean}
   */
  isEnabled() { return this.enabledProperty.value; }

  // @public
  get enabled() { return this.isEnabled(); }

  // @public
  dispose() {
    this.disposeEnabledComponent();
  }
}

axon.register( 'EnabledComponent', EnabledComponent );
export default EnabledComponent;