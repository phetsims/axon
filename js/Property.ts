// Copyright 2022, University of Colorado Boulder

import IProperty from './IProperty.js';
import { AbstractProperty, PropertyOptions } from './AbstractProperty.js';
import axon from './axon.js';

/**
 * Adds initial value and reset, and a mutable interface.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default class Property<T> extends AbstractProperty<T> implements IProperty<T> {

  protected _initialValue: T;

  constructor( value: T, providedOptions?: PropertyOptions<T> ) {
    super( value, providedOptions );

    // Initial value
    this._initialValue = value;
  }

  /**
   * Returns the initial value of this Property.
   */
  getInitialValue(): T {
    return this._initialValue;
  }

  get initialValue(): T {
    return this.getInitialValue();
  }

  /**
   * Stores the specified value as the initial value, which will be taken on reset. Sims should use this sparingly,
   * typically only in situations where the initial value is unknowable at instantiation.
   */
  setInitialValue( initialValue: T ): void {
    this._initialValue = initialValue;
  }

  /**
   * Overridden to make public
   */
  override get value(): T {
    return super.value;
  }

  /**
   * Overridden to make public
   */
  override set value( newValue: T ) {
    this.set( newValue );
  }

  /**
   * Overridden to make public
   */
  override reset(): void {
    super.reset();
  }

  /**
   * Overridden to make public
   */
  override set( value: T ): void {
    super.set( value );
  }
}

// TODO https://github.com/phetsims/axon/issues/342 Move this to AbstractProperty
export { AbstractProperty };
export type { PropertyOptions };

axon.register( 'Property', Property );