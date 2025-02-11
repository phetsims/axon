// Copyright 2020-2025, University of Colorado Boulder

/**
 * Property to control if something is enabled. This serves as a consistent class to control
 * enabled. It also factors out PhET-iO instrumentation. Likely you should use it in cases like so:
 *
 * const enabledProperty = new BooleanProperty( true, {
 *   tandem: options.tandem.createTandem( 'enabledProperty' ),
 *   phetioFeatured: true
 * } );
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import optionize from '../../phet-core/js/optionize.js';
import axon from './axon.js';
import BooleanProperty, { type BooleanPropertyOptions } from './BooleanProperty.js';

const TANDEM_NAME = 'enabledProperty';

type SelfOptions = {
  checkTandemName?: boolean;
};

export type EnabledPropertyOptions = SelfOptions & BooleanPropertyOptions;

export default class EnabledProperty extends BooleanProperty {
  public constructor( initialEnabled: boolean, providedOptions?: EnabledPropertyOptions ) {

    const options = optionize<EnabledPropertyOptions, SelfOptions, BooleanPropertyOptions>()( {
      phetioDocumentation: 'Determines whether the element is enabled (true) or disabled (false).',
      phetioFeatured: true,

      // by default, the tandem name must match. In rare occurrences (such as when one model must have 2 separate
      // EnabledProperties, like this.mass1EnabledProperty = ..., this.mass2EnabledProperty = ...
      // you can opt out of the name check. This should be used sparingly. For instance, for the example above, it may
      // be better to do this.mass1.enabledProperty anyways.
      checkTandemName: true
    }, providedOptions );

    if ( assert && options && options.tandem && options.tandem.supplied && options.checkTandemName ) {
      assert && assert( options.tandem.name === TANDEM_NAME, `EnabledProperty tandems should be named ${TANDEM_NAME}` );
    }

    super( initialEnabled, options );
  }

  public static get TANDEM_NAME(): string { return TANDEM_NAME; }
}

axon.register( 'EnabledProperty', EnabledProperty );