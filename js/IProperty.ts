// Copyright 2021, University of Colorado Boulder

import IReadOnlyProperty from './IReadOnlyProperty.js';

/**
 * A simple Property/TinyProperty like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// See comments in Property.ts / TinyProperty.ts
interface IProperty<T> extends IReadOnlyProperty<T> {
  set( value: T ): void;
  set value( value: T );
}

export default IProperty;