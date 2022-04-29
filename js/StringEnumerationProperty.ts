// Copyright 2022, University of Colorado Boulder
import Property, { PropertyOptions } from './Property.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import merge from '../../phet-core/js/merge.js';
import deprecationWarning from '../../phet-core/js/deprecationWarning.js';

type StringEnumerationPropertyOptions<T> = Omit<PropertyOptions<T>, 'validValues' | 'phetioType'>;

/**
 * In TypeScript, it is common to use a string literal union as an enumeration.  This type automatically specifies
 * validValues and the phetioType for convenience.
 *
 * @deprecated
 * @author Sam Reid (PhET Interactive Simulations)
 */
class StringEnumerationProperty<T> extends Property<T> {
  constructor( values: readonly T[], value: T, providedOptions?: StringEnumerationPropertyOptions<T> ) {
    deprecationWarning( 'StringEnumerationProperty is soon to be deleted, instead use the EnumerationProperty in ' +
                        'correlation with EnumerationValue subtypes (see WilderEnumerationPatterns for examples' );

    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'validValues' ), 'validValues is supplied by EnumerationProperty' );
    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'phetioType' ), 'phetioType is supplied by EnumerationProperty' );

    const options = merge( {}, providedOptions, {
      validValues: values,
      phetioType: Property.PropertyIO( StringIO )
    } );

    super( value, options );
  }
}

export default StringEnumerationProperty;