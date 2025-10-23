// Copyright 2025, University of Colorado Boulder

/**
 * Convenience method to that allows you to call derived with a map for true/false values.
 * See also DerivedProperty.fromRecord (which does not support boolean keys)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import derived from './derived.js';
import { type UnknownDerivedProperty } from './DerivedProperty.js';
import type { TReadOnlyProperty } from './TReadOnlyProperty.js';

function derivedTernary<T, V>( predicateProperty: TReadOnlyProperty<boolean>, map: { true: TReadOnlyProperty<T>; false: TReadOnlyProperty<V> } ): UnknownDerivedProperty<T | V> {
  return derived( predicateProperty, map.true, map.false, ( predicate, trueValue, falseValue ) => {
    return predicate ? trueValue : falseValue;
  } );
}

export default derivedTernary;
