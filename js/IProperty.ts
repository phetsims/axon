// Copyright 2021-2022, University of Colorado Boulder

import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import IReadOnlyProperty from './IReadOnlyProperty.js';

/**
 * A simple Property/TinyProperty like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// See comments in Property.ts / TinyProperty.ts
type IProperty<T> = StrictOmit<IReadOnlyProperty<T>, 'value'> & {
  set( value: T ): void;
  set value( value: T );
  get value(): T;
};
export default IProperty;