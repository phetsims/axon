// Copyright 2021, University of Colorado Boulder
import Property, { PropertyOptions } from './Property.js';
import StringIO from '../../tandem/js/types/StringIO.js';

/**
 * In TypeScript, it is common to use a string literal union as an enumeration.  This type automatically specifies
 * validValues and the phetioType for convenience.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
class StringEnumerationProperty<T> extends Property<T> {
  constructor( values: readonly T[], value: T, providedOptions?: PropertyOptions<T> ) {
    providedOptions = providedOptions || {};
    providedOptions.validValues = values;
    providedOptions.phetioType = Property.PropertyIO( StringIO );
    super( value, providedOptions );
  }
}

export default StringEnumerationProperty;