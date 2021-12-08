// Copyright 2021, University of Colorado Boulder
/**
 * A simple read-only Property/TinyProperty-like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

type PropertyLinkListener<T> = ( value: T, oldValue: T | null, tinyProperty: IReadOnlyProperty<T> ) => void;
type PropertyLazyLinkListener<T> = ( value: T, oldValue: T, tinyProperty: IReadOnlyProperty<T> ) => void;
type PropertyListener<T> = PropertyLinkListener<T> | PropertyLazyLinkListener<T>;

// See comments in Property.ts / TinyProperty.ts
interface IReadOnlyProperty<T> {
  get() : T;
  get value() : T;
  areValuesEqual( a: T, b: T ): boolean;
  link( listener: PropertyLinkListener<T>, options?: any ): void;
  lazyLink( listener: PropertyLazyLinkListener<T>, options?: any ): void;
  linkAttribute<Attr extends string>( object: { [ key in Attr ]: T }, attributeName: Attr ): any; // eslint-disable-line
  unlink( listener: PropertyListener<T> ): void;
  unlinkAll(): void;
  unlinkAttribute( listener: PropertyLinkListener<T> ): void;
  hasListener( listener: PropertyLinkListener<T> ): boolean;
  isPhetioInstrumented(): boolean;
  isSettable(): boolean;
  dispose(): void;
}

export type { IReadOnlyProperty as default, PropertyListener, PropertyLinkListener, PropertyLazyLinkListener };