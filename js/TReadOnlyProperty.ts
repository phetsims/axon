// Copyright 2021-2025, University of Colorado Boulder

/**
 * A simple read-only Property/TinyProperty-like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ReadOnlyProperty, { type LinkOptions } from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';
import { type ValueComparisonStrategy } from './Validation.js';

// Even though these are the same types used for TProperty, it is vital that the tinyProperty parameter remains
// TReadOnlyProperty to avoid contravariance type errors that may not be checked by TypeScript because contravariance
// type checking is ignored in "method" types but not in "property" types. See https://github.com/phetsims/axon/issues/428#issuecomment-2033071432
export type PropertyLinkListener<T> = ( value: T, oldValue: T | null, tinyProperty: TReadOnlyProperty<T> ) => void;
export type PropertyLazyLinkListener<T> = ( value: T, oldValue: T, tinyProperty: TReadOnlyProperty<T> ) => void;
export type PropertyListener<T> = PropertyLinkListener<T> | PropertyLazyLinkListener<T>;

// See comments in Property.ts / TinyProperty.ts
type TReadOnlyProperty<T> = {
  get: () => T;
  get value(): T;
  areValuesEqual( a: T, b: T ): boolean;
  link( listener: PropertyLinkListener<T>, options?: LinkOptions ): void;
  lazyLink( listener: PropertyLazyLinkListener<T>, options?: LinkOptions ): void;
  linkAttribute<Attr extends string>( object: Record<Attr, T>, attributeName: Attr ): void;
  unlink( listener: PropertyListener<T> ): void;
  unlinkAll(): void;
  hasListener( listener: PropertyLinkListener<T> ): boolean;
  isSettable(): boolean;
  dispose(): void;
  valueComparisonStrategy: ValueComparisonStrategy<T>;
  isDisposed?: boolean;
  toString(): string;
};

export function isTReadOnlyProperty<T = unknown>( something: IntentionalAny ): something is TReadOnlyProperty<T> {
  return something instanceof ReadOnlyProperty || something instanceof TinyProperty;
}

export default TReadOnlyProperty;