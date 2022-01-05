// Copyright 2021, University of Colorado Boulder

/**
 * Property support for rich enumeration types.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import { RichEnumerationContainer } from '../../phet-core/js/IRichEnumeration.js';
import RichEnumerationIO from './RichEnumerationIO.js';
import merge from '../../phet-core/js/merge.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';

type RichEnumerationPropertyOptions<T> = Omit<PropertyOptions<T>, 'validValues' | 'phetioType'>;

class RichEnumerationProperty<T extends EnumerationValue> extends Property<T> {

  /**
   * @param enumerationContainer - for convenience at the client site, this is an object that contains a RichEnumeration named "enum"
   * @param value
   * @param providedOptions
   */
  constructor( enumerationContainer: RichEnumerationContainer<T>, value: T, providedOptions?: RichEnumerationPropertyOptions<T> ) {

    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'validValues' ), 'validValues is supplied by RichEnumerationProperty' );
    assert && assert( !providedOptions || !providedOptions.hasOwnProperty( 'phetioType' ), 'phetioType is supplied by RichEnumerationProperty' );

    const options = merge( {}, providedOptions, {
      validValues: enumerationContainer.enumeration.values,
      phetioType: Property.PropertyIO( RichEnumerationIO<T>( enumerationContainer ) )
    } );

    super( value, options );
  }
}

export default RichEnumerationProperty;