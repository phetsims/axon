import {PhetioObjectOptions} from '../../tandem/js/PhetioObject';
import Property from './Property';

export type PropertyOptions = {} & PhetioObjectOptions;

export default class NumberProperty extends Property<number>{
  constructor( value: number, options?: Partial<PropertyOptions> );

  // get value(): T;
  // set value( t );
  //
  // get(): T;
  //
  // set( t: T ): void;
  //
  // static PropertyIO
  //
  // reset(): void;
  //
  // link( listener: ( T ) => void, options?: Partial<LinkOptions> ): void;
}