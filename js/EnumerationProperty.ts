// Copyright 2021-2022, University of Colorado Boulder

/**
 * Property support for rich enumeration types.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import merge from '../../phet-core/js/merge.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';

type EnumerationPropertyOptions<T> = Omit<PropertyOptions<T>, 'validValues' | 'phetioType'>;

class EnumerationProperty<T extends EnumerationValue> extends Property<T> {

  /**
   * @param value
   * @param providedOptions
   */
  constructor( value: T, providedOptions?: EnumerationPropertyOptions<T> ) {

    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'validValues' ), 'validValues is supplied by EnumerationProperty' );
    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'phetioType' ), 'phetioType is supplied by EnumerationProperty' );

    const options = merge( {}, providedOptions, {
      validValues: value.enumeration!.values,
      phetioType: Property.PropertyIO( EnumerationIO<T>( {
        enumeration: value.enumeration!
      } ) )
    } );

    super( value, options );
  }
}

export default EnumerationProperty;