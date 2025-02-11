// Copyright 2022-2025, University of Colorado Boulder

/**
 * In TypeScript, it is common to use a string literal union as an enumeration.  This type automatically specifies
 * validValues and the phetioType for convenience.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import optionize, { type EmptySelfOptions } from '../../phet-core/js/optionize.js';
import type PickRequired from '../../phet-core/js/types/PickRequired.js';
import type StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import StringUnionIO from '../../tandem/js/types/StringUnionIO.js';
import axon from './axon.js';
import Property, { type PropertyOptions } from './Property.js';

type StringEnumerationPropertyOptions<T> = StrictOmit<PropertyOptions<T>, 'phetioValueType'> &
  PickRequired<PropertyOptions<T>, 'validValues'>;

export default class StringUnionProperty<T extends string> extends Property<T> {
  public constructor( value: T, providedOptions: StringEnumerationPropertyOptions<T> ) {

    const options = optionize<StringEnumerationPropertyOptions<T>, EmptySelfOptions, PropertyOptions<T>>()( {
      phetioValueType: StringUnionIO( providedOptions.validValues )
    }, providedOptions );

    super( value, options );
  }
}

axon.register( 'StringUnionProperty', StringUnionProperty );