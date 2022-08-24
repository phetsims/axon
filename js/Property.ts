// Copyright 2022, University of Colorado Boulder

import TProperty from './TProperty.js';
import ReadOnlyProperty, { PropertyOptions } from './ReadOnlyProperty.js';
import axon from './axon.js';

/**
 * Adds initial value and reset, and a mutable interface.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default class Property<T> extends ReadOnlyProperty<T> implements TProperty<T> {

  protected _initialValue: T;

  public constructor( value: T, providedOptions?: PropertyOptions<T> ) {
    super( value, providedOptions );

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
   * We ran performance tests on Chrome, and determined that calling super.value = newValue is statistically significantly
   * slower at the p = 0.10 level( looping over 10,000 value calls). Therefore, we prefer this optimization.
   */
  public override set value( newValue: T ) {
    super.set( newValue );
  }

  public reset(): void {
    this.set( this._initialValue );
  }

  /**
   * Overridden to make public
   */
  public override set( value: T ): void {
    super.set( value );
  }

  public override isSettable(): boolean {
    return true;
  }
}

export type { PropertyOptions };

axon.register( 'Property', Property );