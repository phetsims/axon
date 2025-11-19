// Copyright 2025, University of Colorado Boulder

/**
 * Convenience method to that allows you to call derived with a map for true/false values.
 * See also DerivedProperty.fromRecord (which does not support boolean keys).
 * This is named derivedTernary because it is analogous to the ? ternary operator: predicate ? trueValue : falseValue
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import derived from './derived.js';
import { type UnknownDerivedProperty } from './DerivedProperty.js';
import { isTReadOnlyProperty, TReadOnlyProperty } from './TReadOnlyProperty.js';

function derivedTernary<T, V>( predicateProperty: TReadOnlyProperty<boolean>, map: { true: TReadOnlyProperty<T> | T; false: TReadOnlyProperty<V> | V } ): UnknownDerivedProperty<T | V> {

  if ( isTReadOnlyProperty( map.true ) && isTReadOnlyProperty( map.false ) ) {
    return derived( predicateProperty, map.true, map.false, ( predicate, trueValue, falseValue ) => {
      return predicate ? trueValue : falseValue;
    } );
  }
  else if ( isTReadOnlyProperty( map.true ) ) {
    return derived( predicateProperty, map.true, ( predicate, trueValue ) => {
      return predicate ? trueValue : map.false as V;
    } );
  }
  else if ( isTReadOnlyProperty( map.false ) ) {
    return derived( predicateProperty, map.false, ( predicate, falseValue ) => {
      return predicate ? map.true as T : falseValue;
    } );
  }
  else {
    return derived( predicateProperty, predicate => {
      return predicate ? map.true as T : map.false as V;
    } );
  }
}

export default derivedTernary;
