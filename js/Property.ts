// Copyright 2022, University of Colorado Boulder

import IProperty from './IProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import { PropertyOptions } from './ReadOnlyProperty.js';
import axon from './axon.js';

/**
 * Adds initial value and reset, and a mutable interface.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default class Property<T> extends ReadOnlyProperty<T> implements IProperty<T> {

  protected _initialValue: T;

  public constructor( value: T, providedOptions?: PropertyOptions<T> ) {
    super( value, providedOptions );

    // Initial value
    this._initialValue = value;
  }

  /**
   * Returns the initial value of this Property.
   */
  public getInitialValue(): T {
    return this._initialValue;
  }

  public get initialValue(): T {
    return this.getInitialValue();
  }

  /**
   * Stores the specified value as the initial value, which will be taken on reset. Sims should use this sparingly,
   * typically only in situations where the initial value is unknowable at instantiation.
   */
  public setInitialValue( initialValue: T ): void {
    this._initialValue = initialValue;
  }

  /**
   * Overridden to make public
   */
  public override get value(): T {
    return super.value;
  }

  /**
   * Overridden to make public
   */
  public override set value( newValue: T ) {
    this.set( newValue );
  }

  /**
   * Overridden to make public
   */
  public override reset(): void {
    super.reset();
  }

  /**
   * Overridden to make public
   */
  public override set( value: T ): void {
    super.set( value );
  }
}

export type { PropertyOptions };

axon.register( 'Property', Property );