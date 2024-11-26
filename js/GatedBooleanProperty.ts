// Copyright 2024, University of Colorado Boulder

/**
 * The GatedVisibleProperty class abstracts the process of creating a "gated" visibility Property
 * designed for PhET-iO integration. This pattern comes in handy when an object's visibility is already controlled
 * within the simulation, but there is a need to grant additional visibility control to an external entity,
 * such as a studio or a PhET-iO client.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import Tandem from '../../tandem/js/Tandem.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import axon from './axon.js';
import BooleanProperty, { BooleanPropertyOptions } from './BooleanProperty.js';
import { DerivedProperty2, DerivedPropertyOptions } from './DerivedProperty.js';
import TProperty from './TProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';

type SelfOptions = {
  tandemName?: string;
  selfTandemName?: string;
  selfBooleanInitialValue?: boolean;
  selfBooleanPropertyOptions?: BooleanPropertyOptions;
};
type ParentOptions = DerivedPropertyOptions<boolean>;
type GatedBooleanPropertyOptions = SelfOptions & StrictOmit<ParentOptions, 'tandem'>;

class GatedBooleanProperty extends DerivedProperty2<boolean, boolean, boolean> {
  public readonly selfBooleanProperty: TProperty<boolean>;

  public constructor( providedBooleanProperty: TReadOnlyProperty<boolean>, parentTandem: Tandem, providedOptions?: GatedBooleanPropertyOptions ) {

    const options = optionize<GatedBooleanPropertyOptions, SelfOptions, ParentOptions>()( {
      tandemName: 'property',
      selfTandemName: 'selfProperty',
      selfBooleanInitialValue: true,
      selfBooleanPropertyOptions: {
        phetioFeatured: true
      },

      phetioValueType: BooleanIO
      // see below for phetioDocumentation, replaces {{SELF_PROPERTY_TANDEM_NAME}} with the name of the self property
    }, providedOptions );

    if ( !options.tandem ) {
      options.tandem = parentTandem.createTandem( options.tandemName );
    }
    if ( !options.selfBooleanPropertyOptions.tandem ) {
      options.selfBooleanPropertyOptions.tandem = parentTandem.createTandem( options.selfTandemName );
    }

    const selfBooleanProperty = new BooleanProperty( options.selfBooleanInitialValue, options.selfBooleanPropertyOptions );
    if ( options.phetioDocumentation ) {
      options.phetioDocumentation = options.phetioDocumentation.replace( '{{SELF_PROPERTY_TANDEM_NAME}}', selfBooleanProperty.tandem.name );
    }

    super(
      [ providedBooleanProperty, selfBooleanProperty ],
      ( providedBoolean, selfBoolean ) => providedBoolean && selfBoolean,
      options
    );

    this.selfBooleanProperty = selfBooleanProperty;
  }

  public override dispose(): void {

    // Remove the selfBooleanProperty from the PhET-iO registry
    this.selfBooleanProperty.dispose();
    super.dispose();
  }
}

export class GatedVisibleProperty extends GatedBooleanProperty {
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

export class GatedEnabledProperty extends GatedBooleanProperty {
  public constructor( providedBooleanProperty: TReadOnlyProperty<boolean>, parentTandem: Tandem, providedOptions?: GatedBooleanPropertyOptions ) {

    const options = optionize<GatedBooleanPropertyOptions, EmptySelfOptions, GatedBooleanPropertyOptions>()( {
      tandemName: 'enabledProperty',
      selfTandemName: 'selfEnabledProperty',
      phetioDocumentation: 'Whether the PhET-iO Element is enabled, see {{SELF_PROPERTY_TANDEM_NAME}} for customization.',
      selfBooleanPropertyOptions: {
        phetioDocumentation: 'Provides an additional way to toggle enabled for the PhET-iO Element.'
      }
    }, providedOptions );

    super( providedBooleanProperty, parentTandem, options );
  }
}

export default GatedBooleanProperty;

axon.register( 'GatedBooleanProperty', GatedBooleanProperty );