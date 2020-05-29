// Copyright 2020, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed. This includes additional logic for conditionally
 * forwarding to/from another Property.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyProperty from './TinyProperty.js';

class TinyForwardingProperty extends TinyProperty {
  /**
   * @param {*} value - The initial value of the property
   * @param {Object} [options] - options
   */
  constructor( value, options ) {
    super( value, options );

    // @protected {Property.<*>|null|undefined} forwardingProperty - Set in setForwardingProperty
    // @protected {function} forwardingListener - Set lazily in setForwardingProperty
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   * @public
   *
   * @param {Property.<*>|null} property - null to "unset" forwarding.
   */
  setForwardingProperty( property ) {
    const oldValue = this.get();

    // Lazily set this value, it will be added as a listener to any forwardingProperty we have.
    this.forwardingListener = this.forwardingListener || ( ( value, oldValue, property ) => {
      this.notifyListeners( oldValue );
    } );

    if ( this.forwardingProperty ) {
      this.forwardingProperty.unlink( this.forwardingListener );
    }

    this.forwardingProperty = property;

    if ( this.forwardingProperty ) {
      this.forwardingProperty.lazyLink( this.forwardingListener );
    }
    else {
      // If we're switching away from a forwardingProperty, prefer no notification (so set our value to the last value)
      this._value = oldValue;
    }

    const newValue = this.get();

    // Changing forwarding COULD change the value, so send notifications if this is the case.
    if ( !this.areValuesEqual( oldValue, newValue ) ) {
      this.notifyListeners( oldValue );
    }
  }

  /**
   * Gets the value.
   * @public
   * @override
   *
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   */
  get() {
    this.onAccessAttempt && this.onAccessAttempt();

    if ( this.forwardingProperty ) {
      return this.forwardingProperty.value;
    }
    else {
      return this._value;
    }
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   * @public
   * @override
   *
   * @param {*} value
   * @returns {TinyForwardingProperty} this instance, for chaining.
   */
  set( value ) {
    if ( this.forwardingProperty ) {
      this.forwardingProperty.set( value );
    }
    else {
      super.set( value );
    }
    return this;
  }

  /**
   * Directly notifies listeners of changes. This needs to be an override to make sure that the value of the forwarding
   * Property is used if it exists.
   * @public
   * @override
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {
    this.emit( this.get(), oldValue, this );
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   * @public
   * @override - So we can call the slightly more expensive getter, instead of the direct access
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   */
  link( listener ) {
    this.addListener( listener );

    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
export default TinyForwardingProperty;