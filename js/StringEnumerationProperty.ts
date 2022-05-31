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
import OmitStrict from '../../phet-core/js/types/OmitStrict.js';

type StringEnumerationPropertyOptions<T> = OmitStrict<PropertyOptions<T>, 'phetioType'> &
  PickRequired<PropertyOptions<T>, 'validValues'>;

class StringEnumerationProperty<T extends string> extends Property<T> {
  constructor( value: T, providedOptions?: StringEnumerationPropertyOptions<T> ) {

    const options = optionize<StringEnumerationPropertyOptions<T>, {}, PropertyOptions<T>>()( {
      phetioType: Property.PropertyIO( StringIO )
    }, providedOptions );

    super( value, options );
  }
}

export default StringEnumerationProperty;