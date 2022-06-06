// Copyright 2016-2022, University of Colorado Boulder

/**
 * Property whose value must be true or false. Truthy/falsy values are invalid.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import axon from './axon.js';
import Property, { PropertyOptions } from './Property.js';

// constants
const BooleanPropertyIO = Property.PropertyIO( BooleanIO );

type SelfOptions = {};
export type BooleanPropertyOptions = SelfOptions & PropertyOptions<boolean>;

export default class BooleanProperty extends Property<boolean> {

  public constructor( value: boolean, options?: BooleanPropertyOptions ) {

    if ( options ) {

      // client cannot specify superclass options that are not supported by BooleanProperty
      assert && assert( !options.hasOwnProperty( 'isValidValue' ), 'BooleanProperty does not support isValidValue' );

      // client cannot specify superclass options that are controlled by BooleanProperty
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'BooleanProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'BooleanProperty sets phetioType' );
    }

    // Fill in superclass options that are controlled by BooleanProperty.
    options = optionize<BooleanPropertyOptions, SelfOptions, PropertyOptions<boolean>>()( {
      valueType: 'boolean',
      phetioType: BooleanPropertyIO
    }, options );

    super( value, options );
  }

  public toggle(): void {
    this.value = !this.value;
  }
}

axon.register( 'BooleanProperty', BooleanProperty );
