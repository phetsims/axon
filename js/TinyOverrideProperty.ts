// Copyright 2022, University of Colorado Boulder

/**
 * A TinyProperty that will take the value of a target Property until it is set to a value. When that happens, it will
 * be its own standalone Property.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyProperty from './TinyProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';

export default class TinyOverrideProperty<T> extends TinyProperty<T> {

  // If true, we ignore our targetProperty and just use our value. If false, we only report the value of the
  // targetProperty
  public isOverridden = false;

  private _targetProperty: TReadOnlyProperty<T>;
  private readonly _targetListener: ( newValue: T, oldValue: T ) => void;

  public constructor( targetProperty: TReadOnlyProperty<T> ) {
    super( targetProperty.value );

    this._targetProperty = targetProperty;

    assert && assert( !this.isOverridden, 'Should not be overridden on startup' );

    // We'll need to listen to our target to dispatch notifications
    this._targetListener = this.onTargetPropertyChange.bind( this );
    this._targetProperty.lazyLink( this._targetListener );
  }

  public set targetProperty( targetProperty: TReadOnlyProperty<T> ) {
    this.setTargetProperty( targetProperty );
  }

  public setTargetProperty( targetProperty: TReadOnlyProperty<T> ): void {
    // no-op if it's the same Property
    if ( this.targetProperty === targetProperty ) {
      return;
    }

    const oldValue = this.value;

    // Listeners are only connected if we are NOT overridden
    if ( !this.isOverridden ) {
      this._targetProperty.unlink( this._targetListener );
    }

    this._targetProperty = targetProperty;

    // Listeners are only connected if we are NOT overridden
    if ( !this.isOverridden ) {
      this._targetProperty.lazyLink( this._targetListener );

      // If we are overridden, changing the targetProperty will not trigger notifications
      if ( !this.equalsValue( oldValue ) ) {
        this.notifyListeners( oldValue );
      }
    }
  }

  /**
   * Remove the "overridden" nature of this Property, so that it takes on the appearance of the targetProperty
   */
  public clearOverride(): void {
    if ( this.isOverridden ) {
      const oldValue = this.value;

      this.isOverridden = false;
      this._targetProperty.lazyLink( this._targetListener );

      // This could change our value!
      if ( !this.equalsValue( oldValue ) ) {
        this.notifyListeners( oldValue );
      }
    }
  }

  public override get(): T {
    // The main logic for TinyOverrideProperty
    return this.isOverridden ? this._value : this._targetProperty.value;
  }

  public override set( value: T ): void {
    if ( !this.isOverridden ) {
      // Grab the last value of the Property, as it will be "active" after this
      this._value = this._targetProperty.value;
    }

    super.set( value );
  }

  public override setPropertyValue( value: T ): void {
    // Switch to "override"
    if ( !this.isOverridden ) {
      this.isOverridden = true;
      this._targetProperty.unlink( this._targetListener );
    }

    super.setPropertyValue( value );
  }

  // We have to override here to have the getter called
  protected override equalsValue( value: T ): boolean {
    return this.areValuesEqual( value, this.value );
  }

  private onTargetPropertyChange( newValue: T, oldValue: T ): void {
    if ( !this.isOverridden ) {
      this.notifyListeners( oldValue );
    }
  }

  // Overridden, since we need to call our getter
  public override notifyListeners( oldValue: T ): void {
    this.emit( this.value, oldValue, this );
  }

  public override dispose(): void {
    // If we've been overridden, we will already have removed the listener
    if ( !this.isOverridden ) {
      this._targetProperty.unlink( this._targetListener );
    }

    super.dispose();
  }
}

axon.register( 'TinyOverrideProperty', TinyOverrideProperty );
