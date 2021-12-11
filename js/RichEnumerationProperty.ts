// Copyright 2021, University of Colorado Boulder

/**
 * Property support for rich enumeration types.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import IRichEnumeration from '../../phet-core/js/IRichEnumeration.js';
import RichEnumerationIO from './RichEnumerationIO.js';

class RichEnumerationProperty<T> extends Property<T> {

  /**
   * @param enumerationContainer - for convenience at the client site, this is an object that contains a RichEnumeration named "enum"
   * @param value
   * @param providedOptions
   */
  constructor( enumerationContainer: { enum: IRichEnumeration<T> }, value: T, providedOptions?: PropertyOptions<T> ) {
    providedOptions = providedOptions || {};
    providedOptions.validValues = enumerationContainer.enum.values;
    providedOptions.phetioType = Property.PropertyIO( RichEnumerationIO<T>( enumerationContainer ) );
    super( value, providedOptions );
  }
}

export default RichEnumerationProperty;