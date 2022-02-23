// Copyright 2021-2022, University of Colorado Boulder

/**
 * Property support for rich enumeration types.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import optionize from '../../phet-core/js/optionize.js';
import Enumeration from '../../phet-core/js/Enumeration.js';

type EnumerationPropertySelfOptions<T extends EnumerationValue> = {

  // By default, this will be taken from the initial value, but if subtyping enumerations, you must provide this
  // manually to make sure it is set to the correct, subtype value, see https://github.com/phetsims/phet-core/issues/102
  enumeration?: Enumeration<T>
};

type EnumerationPropertyOptions<T extends EnumerationValue> = EnumerationPropertySelfOptions<T> & Omit<PropertyOptions<T>, 'phetioType'>;

class EnumerationProperty<T extends EnumerationValue> extends Property<T> {

  /**
   * @param value
   * @param providedOptions
   */
  constructor( value: T, providedOptions?: EnumerationPropertyOptions<T> ) {

    const firstOptions = optionize<EnumerationPropertyOptions<T>, EnumerationPropertySelfOptions<T>, PropertyOptions<T>>( {
      enumeration: value.enumeration!
    }, providedOptions );

    const options = optionize<EnumerationPropertyOptions<T>, {}, PropertyOptions<T>>( {
      validValues: firstOptions.enumeration.values,
      phetioType: Property.PropertyIO( EnumerationIO<T>( {
        enumeration: firstOptions.enumeration
      } ) )
    }, firstOptions );

    super( value, options );
  }
}

export default EnumerationProperty;