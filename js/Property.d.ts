import {PhetioObjectOptions} from '../../tandem/js/PhetioObject';

export type PropertyOptions = {
} & PhetioObjectOptions;

export default class Property<T> {
  constructor( value: T, options?: Partial<PropertyOptions> );
  get value(): T;
  set value( t );
  get():T;
  set(t:T):void;
  static PropertyIO
}