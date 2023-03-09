// Copyright 2020-2023, University of Colorado Boulder

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
import TinyEmitter from './TinyEmitter.js';
import TProperty from './TProperty.js';
import TReadOnlyProperty, { PropertyLazyLinkListener, PropertyLinkListener, PropertyListener } from './TReadOnlyProperty.js';

export type ComparableObject = {
  equals: ( a: unknown ) => boolean;
};
export type TinyPropertyEmitterParameters<T> = [ T, T | null, TReadOnlyProperty<T> ];
export type TinyPropertyOnBeforeNotify<T> = ( ...args: TinyPropertyEmitterParameters<T> ) => void;

export default class TinyProperty<T> extends TinyEmitter<TinyPropertyEmitterParameters<T>> implements TProperty<T> {

  public _value: T; // Store the internal value -- NOT for general use (but used in Scenery for performance)

  // Forces use of the deep equality checks. Keeps some compatibility with the Property interface to have the equality
  // check in this type too. Not defining in the general case for memory usage, only using if we notice this flag set.
  protected useDeepEquality?: boolean;

  public constructor( value: T, onBeforeNotify?: TinyPropertyOnBeforeNotify<T> | null, hasListenerOrderDependencies?: boolean ) {
    super( onBeforeNotify, hasListenerOrderDependencies );

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
   * Returns true if and only if the specified value equals the value of this property
   */
  protected equalsValue( value: T ): boolean {
    return this.areValuesEqual( value, this._value );
  }

  /**
   * Determines equality semantics for the wrapped type, including whether notifications are sent out when the
   * wrapped value changes, and whether onValue is triggered.
   * (Property)
   *
   * useDeepEquality: true => Use the `equals` method on the values
   * useDeepEquality: false => Use === for equality test
   *
   * Alternatively different implementation can be provided by subclasses or instances to change the equals
   * definition. See #10 and #73 and #115
   */
  public areValuesEqual( a: T, b: T ): boolean {
    if ( this.useDeepEquality ) {
      const aObject = a as unknown as ComparableObject;
      const bObject = b as unknown as ComparableObject;

      if ( aObject && bObject && aObject.constructor === bObject.constructor ) {
        assert && assert( !!aObject.equals, 'no equals function for 1st arg' );
        assert && assert( !!bObject.equals, 'no equals function for 2nd arg' );
        assert && assert( aObject.equals( bObject ) === bObject.equals( aObject ), 'incompatible equality checks' );
        return aObject.equals( bObject );
      }
    }

    // Reference equality for objects, value equality for primitives
    return a === b;
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
  public linkAttribute<Attr extends string>( object: { [key in Attr]: T }, attributeName: Attr ): ( value: T ) => void {
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
