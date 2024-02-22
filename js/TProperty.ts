// Copyright 2021-2024, University of Colorado Boulder

import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

/**
 * A simple Property/TinyProperty like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// See comments in Property.ts / TinyProperty.ts
type TProperty<T> = StrictOmit<TReadOnlyProperty<T>, 'value'> & {
  set( value: T ): void;
  set value( value: T );
  get value(): T;
};

export function isTProperty<T = unknown>( something: IntentionalAny ): something is TProperty<T> {
  return ( something instanceof ReadOnlyProperty || something instanceof TinyProperty ) && something.isSettable();
}

export default TProperty;