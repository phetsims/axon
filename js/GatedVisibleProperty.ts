// Copyright 2025, University of Colorado Boulder

/**
 * Subclass of GatedBooleanProperty that provides a boolean Property that can be used to control the visibility.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import optionize, { type EmptySelfOptions } from '../../phet-core/js/optionize.js';
import type Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import GatedBooleanProperty, { GatedBooleanPropertyOptions } from './GatedBooleanProperty.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';

/**
 * Provides PhET-iO clients with a way to permanently hide this Node via 'selfVisibleProperty'
 */
export default class GatedVisibleProperty extends GatedBooleanProperty {
  public constructor( providedBooleanProperty: TReadOnlyProperty<boolean>, parentTandem: Tandem, providedOptions?: GatedBooleanPropertyOptions ) {

    const options = optionize<GatedBooleanPropertyOptions, EmptySelfOptions, GatedBooleanPropertyOptions>()( {
      tandemName: 'visibleProperty',
      selfTandemName: 'selfVisibleProperty',
      phetioDocumentation: 'Whether the PhET-iO Element is visible, see {{SELF_PROPERTY_TANDEM_NAME}} for customization.',
      selfBooleanPropertyOptions: {
        phetioDocumentation: 'Provides an additional way to toggle the visibility for the PhET-iO Element.'
      }
    }, providedOptions );

    super( providedBooleanProperty, parentTandem, options );
  }
}

axon.register( 'GatedVisibleProperty', GatedVisibleProperty );