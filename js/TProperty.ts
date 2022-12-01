// Copyright 2021-2022, University of Colorado Boulder

import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import TinyProperty from './TinyProperty.js';

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

export function isTProperty( something: IntentionalAny ): something is TProperty<unknown> {
  return ( something instanceof ReadOnlyProperty || something instanceof TinyProperty ) && something.isSettable();
}

export default TProperty;