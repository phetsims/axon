// Copyright 2021, University of Colorado Boulder
/**
 * A simple read-only Property/TinyProperty-like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

type PropertyLinkListener<T> = ( value: T, oldValue: T | null, tinyProperty: IReadOnlyProperty<T> ) => void;
type PropertyLazyLinkListener<T> = ( value: T, oldValue: T, tinyProperty: IReadOnlyProperty<T> ) => void;

// See comments in Property.ts / TinyProperty.ts
interface IReadOnlyProperty<T> {
  get() : T;
  get value() : T;
  areValuesEqual( a: T, b: T ): boolean;
  link( listener: PropertyLinkListener<T> ): void;
  lazyLink( listener: PropertyLazyLinkListener<T> ): void;
  unlink( listener: PropertyLinkListener<T> ): void;
  unlinkAll(): void;
  linkAttribute<Attr extends string>( object: { [ key in Attr ]: T }, attributeName: Attr ): PropertyLinkListener<T>; // eslint-disable-line
  unlinkAttribute( listener: PropertyLinkListener<T> ): void;
  isPhetioInstrumented(): boolean;
  isSettable(): boolean;
  dispose(): void;
}

export { IReadOnlyProperty as default, PropertyLinkListener, PropertyLazyLinkListener };