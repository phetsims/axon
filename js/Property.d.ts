import {PhetioObjectOptions} from '../../tandem/js/PhetioObject';

export type PropertyOptions = {} & PhetioObjectOptions;

interface LinkOptions {}

interface Tandem {
}

export default class Property<T> {
  constructor( value: T, options?: Partial<PropertyOptions> );

  get value(): T;
  set value( t );

  get(): T;

  set( t: T ): void;

  static PropertyIO

  reset(): void;

  link( listener: ( T ) => void, options?: Partial<LinkOptions> ): void;

  tandem:Tandem;
}