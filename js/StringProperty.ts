// Copyright 2016-2022, University of Colorado Boulder

/**
 * StringProperty is a Property whose value is a string.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import Property, { PropertyOptions } from './Property.js';

type SelfOptions = EmptySelfOptions;

export type StringPropertyOptions = SelfOptions & StrictOmit<PropertyOptions<string>, 'valueType' | 'phetioValueType'>;

export default class StringProperty extends Property<string> {

  public constructor( value: string, providedOptions?: StringPropertyOptions ) {

    // client cannot specify superclass options that are controlled by StringProperty
    if ( providedOptions ) {
      assert && assert( !providedOptions.hasOwnProperty( 'valueType' ), 'StringProperty sets valueType' );
      assert && assert( !providedOptions.hasOwnProperty( 'phetioType' ), 'StringProperty sets phetioType' );
    }

    // Fill in superclass options that are controlled by StringProperty.
    const options = optionize<StringPropertyOptions, SelfOptions, PropertyOptions<string>>()( {
      valueType: 'string',
      phetioValueType: StringIO
    }, providedOptions );

    super( value, options );
  }
}

axon.register( 'StringProperty', StringProperty );