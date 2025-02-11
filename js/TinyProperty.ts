// Copyright 2020-2025, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed.
 *
 * This directly extends TinyEmitter in order to save memory.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyEmitter, { type TinyEmitterOptions } from './TinyEmitter.js';
import type TProperty from './TProperty.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';
import type { PropertyLazyLinkListener, PropertyLinkListener, PropertyListener } from './TReadOnlyProperty.js';
import Validation, { type ValueComparisonStrategy } from './Validation.js';

export type TinyPropertyEmitterParameters<T> = [ T, T | null, TReadOnlyProperty<T> ];
export type TinyPropertyOnBeforeNotify<T> = ( ...args: TinyPropertyEmitterParameters<T> ) => void;

// Just a shorter name
type OptionsAlias<T> = TinyEmitterOptions<TinyPropertyEmitterParameters<T>>;

export default class TinyProperty<T> extends TinyEmitter<TinyPropertyEmitterParameters<T>> implements TProperty<T> {

  public _value: T; // Store the internal value -- NOT for general use (but used in Scenery for performance)

  // If provided, force use of the custom value comparison beyond reference equality checks. Keeps some compatibility
  // with the Property interface to have the equality check in this type too. Not defining in the general case for
  // memory usage, only using if we notice this flag set. This is not readonly so that we can update this after construction. Defaults to "reference".
  public _valueComparisonStrategy?: ValueComparisonStrategy<T>;

  public constructor( value: T, onBeforeNotify?: OptionsAlias<T>['onBeforeNotify'] | null,
                      hasListenerOrderDependencies?: OptionsAlias<T>['hasListenerOrderDependencies'] | null,
                      reentrantNotificationStrategy?: OptionsAlias<T>['reentrantNotificationStrategy'] | null ) {

    // Defaults to "queue" for Properties so that we notify all listeners for a value change
    // before notifying for the next value change. For example, if we change from a->b, and one listener changes the value
    // from b->c, that reentrant value change will queue its listeners for after all listeners have fired for a->b. For
    // specifics see documentation in TinyEmitter.
    super( onBeforeNotify, hasListenerOrderDependencies, reentrantNotificationStrategy || 'queue' );

    this._value = value;
  }

  /**
   * Returns the value.
   *
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   */
  public get(): T {
    return this._value;
  }

  /**
   * Returns the value.
   */
  public get value(): T {
    return this.get();
  }

  /**
   * Sets the value.
   */
  public set value( newValue: T ) {
    this.set( newValue );
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   */
  public set( value: T ): void {

    // It is very important that `equalsValue` holds all logic about if the value should change AND if listeners
    // are notified.
    if ( !this.equalsValue( value ) ) {
      const oldValue = this._value;

      this.setPropertyValue( value );

      this.notifyListeners( oldValue );
    }
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   */
  public setPropertyValue( value: T ): void {
    this._value = value;
  }

  /**
   * Returns true if and only if the specified value equals the value of this property. This is used to determine if
   * a Property's value should change and if listeners should be notified. In general, this implementation should
   * not be overridden except to provide more correct "value"s as parameters for the areValuesEqual() function.
   */
  protected equalsValue( value: T ): boolean {
    return this.areValuesEqual( value, this._value );
  }

  /**
   * Central logic for determining value equality for Property. This determines if a value should change, and if
   * listeners should notify based on set() call.
   *
   * Determines equality semantics for value comparison, including whether notifications are sent out when the
   * wrapped value changes, and whether onValue() is triggered. See Validation.equalsForValidationStrategy for details
   * and doc on ValueComparisonStrategy
   *
   * Overriding this function is deprecated, instead provide a custom valueComparisonStrategy.
   */
  public areValuesEqual( a: T, b: T ): boolean {
    return Validation.equalsForValidationStrategy<T>( a, b, this.valueComparisonStrategy );
  }

  /**
   * Directly notifies listeners of changes.
   */
  public notifyListeners( oldValue: T ): void {
    // We use this._value here for performance, AND to avoid calling onAccessAttempt unnecessarily.
    this.emit( this._value, oldValue, this );
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   */
  public link( listener: PropertyLinkListener<T> ): void {
    this.addListener( listener );

    listener( this._value, null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the TinyProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   */
  public lazyLink( listener: PropertyLazyLinkListener<T> ): void {
    this.addListener( listener as PropertyLinkListener<T> ); // Because it's a lazy link, it will never be called with null
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   */
  public unlink( listener: PropertyListener<T> ): void {
    this.removeListener( listener as PropertyLinkListener<T> );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   */
  public unlinkAll(): void {
    this.removeAllListeners();
  }

  /**
   * Links an object's named attribute to this TinyProperty.  Returns a handle so it can be removed using
   * TinyProperty.unlink();
   * Example: modelVisibleProperty.linkAttribute(view, 'visible');
   *
   * NOTE: Duplicated with Property.linkAttribute
   */
  public linkAttribute<Attr extends string>( object: Record<Attr, T>, attributeName: Attr ): ( value: T ) => void {
    const handle = ( value: T ) => { object[ attributeName ] = value; };
    this.link( handle );
    return handle;
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   */
  public isSettable(): boolean {
    return true;
  }

  public get valueComparisonStrategy(): ValueComparisonStrategy<T> {
    return this._valueComparisonStrategy || 'reference';
  }

  public set valueComparisonStrategy( valueComparisonStrategy: ValueComparisonStrategy<T> ) {
    this._valueComparisonStrategy = valueComparisonStrategy;
  }

  /**
   * Releases references.
   */
  public override dispose(): void {
    // Remove any listeners that are still attached (note that the emitter dispose would do this also, but without the
    // potentially-needed extra logic of changeCount, etc.)
    this.unlinkAll();

    super.dispose();
  }
}

axon.register( 'TinyProperty', TinyProperty );