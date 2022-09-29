// Copyright 2021-2022, University of Colorado Boulder
import { LinkOptions } from './ReadOnlyProperty.js';

/**
 * A simple read-only Property/TinyProperty-like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

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
  linkAttribute<Attr extends string>( object: { [key in Attr]: T }, attributeName: Attr ): void;
  unlink( listener: PropertyListener<T> ): void;
  unlinkAll(): void;
  hasListener( listener: PropertyLinkListener<T> ): boolean;
  isSettable(): boolean;
  dispose(): void;

  isDisposed?: boolean;
  toString(): string;
};
export default TReadOnlyProperty;