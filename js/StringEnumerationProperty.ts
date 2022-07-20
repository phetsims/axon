// Copyright 2022, University of Colorado Boulder

/**
 * In TypeScript, it is common to use a string literal union as an enumeration.  This type automatically specifies
 * validValues and the phetioType for convenience.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import optionize from '../../phet-core/js/optionize.js';
import PickRequired from '../../phet-core/js/types/PickRequired.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import { EmptySelfOptions } from '../../phet-core/js/optionize.js';

type StringEnumerationPropertyOptions<T> = StrictOmit<PropertyOptions<T>, 'phetioType'> &
  PickRequired<PropertyOptions<T>, 'validValues'>;

class StringEnumerationProperty<T extends string> extends Property<T> {
  public constructor( value: T, providedOptions?: StringEnumerationPropertyOptions<T> ) {

    const options = optionize<StringEnumerationPropertyOptions<T>, EmptySelfOptions, PropertyOptions<T>>()( {
      phetioType: Property.PropertyIO( StringIO )
    }, providedOptions );

    super( value, options );
  }
}

export default StringEnumerationProperty;