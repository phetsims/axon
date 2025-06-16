// Copyright 2024-2025, University of Colorado Boulder

/**
 * The GatedBooleanProperty class abstracts the process of creating a boolean Property with an extra controlling Property.
 * Partially designed for its primary use case, PhET-iO instrumented Properties. This pattern comes in handy when an
 * object's boolean value is already controlled within the simulation, but there is a need to grant additional control
 * to an external entity such as a studio or a PhET-iO client. Here "gate" is an extra level of control (via the
 * composed Property). The class is a DerivedProperty that listens correctly to convey the boolean with
 * respect to all inputs.
 *
 * Subclasses GatedVisibleProperty and GatedEnabledProperty should be used when your Property fills the role
 * of a visibleProperty or enabledProperty respectively. These subclasses provide standardized tandem names
 * and PhET-iO metadata.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import optionize from '../../phet-core/js/optionize.js';
import type StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import type Tandem from '../../tandem/js/Tandem.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import axon from './axon.js';
import BooleanProperty, { type BooleanPropertyOptions } from './BooleanProperty.js';
import { DerivedProperty2, type DerivedPropertyOptions } from './DerivedProperty.js';
import type TProperty from './TProperty.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';

type SelfOptions = {
  tandemName?: string;
  selfTandemName?: string;
  selfBooleanInitialValue?: boolean;
  selfBooleanPropertyOptions?: BooleanPropertyOptions;
};
type ParentOptions = DerivedPropertyOptions<boolean>;
export type GatedBooleanPropertyOptions = SelfOptions & StrictOmit<ParentOptions, 'tandem'>;

export default class GatedBooleanProperty extends DerivedProperty2<boolean, boolean, boolean> {
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

axon.register( 'GatedBooleanProperty', GatedBooleanProperty );