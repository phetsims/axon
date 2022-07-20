// Copyright 2016-2022, University of Colorado Boulder

/**
 * Property whose value must be true or false. Truthy/falsy values are invalid.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import axon from './axon.js';
import Property, { PropertyOptions } from './Property.js';

// constants
const BooleanPropertyIO = Property.PropertyIO( BooleanIO );

type SelfOptions = EmptySelfOptions;

// client cannot specify superclass options that are controlled by BooleanProperty
export type BooleanPropertyOptions = SelfOptions & StrictOmit<PropertyOptions<boolean>, 'isValidValue' | 'valueType' | 'phetioType'>;

export default class BooleanProperty extends Property<boolean> {

  public constructor( value: boolean, providedOptions?: BooleanPropertyOptions ) {

    // Fill in superclass options that are controlled by BooleanProperty.
    const options = optionize<BooleanPropertyOptions, SelfOptions, PropertyOptions<boolean>>()( {
      valueType: 'boolean',
      phetioType: BooleanPropertyIO
    }, providedOptions );

    super( value, options );
  }

  public toggle(): void {
    this.value = !this.value;
  }
}

axon.register( 'BooleanProperty', BooleanProperty );
