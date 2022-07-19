// Copyright 2021-2022, University of Colorado Boulder

import IReadOnlyProperty from './IReadOnlyProperty.js';

/**
 * A simple Property/TinyProperty like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// See comments in Property.ts / TinyProperty.ts
type IProperty<T> = IReadOnlyProperty<T> & {
  set( value: T ): void;
  set value( value: T );
};
export default IProperty;