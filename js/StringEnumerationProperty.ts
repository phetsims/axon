// Copyright 2022, University of Colorado Boulder
import Property, { PropertyOptions } from './Property.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import optionize from '../../phet-core/js/optionize.js';

type StringEnumerationPropertyOptions<T> = Omit<PropertyOptions<T>, 'validValues' | 'phetioType'>;

/**
 * In TypeScript, it is common to use a string literal union as an enumeration.  This type automatically specifies
 * validValues and the phetioType for convenience.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
class StringEnumerationProperty<T> extends Property<T> {
  constructor( values: readonly T[], value: T, providedOptions?: StringEnumerationPropertyOptions<T> ) {

    const options = optionize<StringEnumerationPropertyOptions<T>, {}, PropertyOptions<T>>()( {
      validValues: values,
      phetioType: Property.PropertyIO( StringIO )
    }, providedOptions );

    super( value, options );
  }
}

export default StringEnumerationProperty;