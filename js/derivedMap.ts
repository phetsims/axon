// Copyright 2025, University of Colorado Boulder

/**
 * Generalized convenience for deriving a Property from a key Property and a Map of cases.
 * Works with ANY key type (booleans, object singletons, etc.). When `fallback` is provided,
 * it is used if the key isn't present in `map`.
 *
 * Map values may be plain values or TReadOnlyProperty values; all property-valued entries
 * (plus an optional fallback property) are tracked as dependencies so updates propagate.
 *
 * See also:
 *  - DerivedProperty.fromRecord for string/number/symbol keys
 *  - derivedTernary for the boolean-literal object-literal convenience
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import affirm from '../../perennial-alias/js/browser-and-node/affirm.js';
import DerivedProperty, { type UnknownDerivedProperty } from './DerivedProperty.js';
import { isTReadOnlyProperty, TReadOnlyProperty } from './TReadOnlyProperty.js';

// Overloads for better DX
function derivedMap<K, V>(
  key: TReadOnlyProperty<K>,
  map: ReadonlyMap<K, TReadOnlyProperty<V> | V>
): UnknownDerivedProperty<V> {

  // All the dependencies that are Properties
  const m: TReadOnlyProperty<V>[] = Array.from( map.values() ).filter( value => isTReadOnlyProperty<V>( value ) );

  // Allow multiple keys to point to the same value
  const uniqueDependencies = _.uniq( m );

  return DerivedProperty.deriveAny( [ key, ...uniqueDependencies ], () => {

    affirm( map.has( key.value ), `derivedMap: key not found in map: ${key.value}` );
    const value = map.get( key.value );

    if ( isTReadOnlyProperty( value ) ) {
      return value.value;
    }
    else {
      return value as V;
    }
  } );
}

export default derivedMap;