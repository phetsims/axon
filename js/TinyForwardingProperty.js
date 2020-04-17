// Copyright 2020, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed. This includes additional logic for conditionally
 * forwarding to/from another Property.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from './TinyEmitter.js';
import axon from './axon.js';

// Inheritance saves memory
class TinyForwardingProperty extends TinyEmitter {

  /**
   * @param {*} value - the initial value of the property
   * @param {Object} [options] - options
   */
  constructor( value, options ) {
    super();

    // @private {*} - Store the internal value
    this._value = value;

    // @private {boolean|undefined} useDeepEquality - Keeps some compatibility with the Property interface to have the
    // options check here. Not defining in the general case for memory usage, only using if we notice the option set.
    // Forces use of the deep equality checks.

    // @private {function|undefined} onAccessAttempt - Not defined for memory usage. When set, it will be called
    // whenever there is an attempt to read the value of this TinyForwardingProperty.

    // @private {Property.<*>|null|undefined} forwardingProperty - Set in setForwardingProperty
    // @private {function} forwardingListener - Set lazily in setForwardingProperty
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   * @public
   *
   * @param {Property.<*>|null} property
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
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   * @public
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
   *
   * @param {*} value
   * @returns {TinyForwardingProperty} this instance, for chaining.
   * @public
   */
  set( value ) {
    if ( this.forwardingProperty ) {
      this.forwardingProperty.set( value );
    }
    else if ( !this.areValuesEqual( value, this._value ) ) {
      const oldValue = this._value;

      this._value = value;

      this.notifyListeners( oldValue );
    }
    return this;
  }

  /**
   * Determines equality semantics for the wrapped type, including whether notifications are sent out when the
   * wrapped value changes, and whether onValue is triggered.
   *
   * useDeepEquality: true => Use the `equals` method on the values
   * useDeepEquality: false => Use === for equality test
   *
   * Alternatively different implementation can be provided by subclasses or instances to change the equals
   * definition. See #10 and #73 and #115
   * @param {Object} a - should have the same type as TinyForwardingProperty element type
   * @param {Object} b - should have the same type as TinyForwardingProperty element type
   * @returns {boolean}
   * @private
   */
  areValuesEqual( a, b ) {
    if ( this.useDeepEquality && a && b && a.constructor === b.constructor ) {

      assert && assert( !!a.equals, 'no equals function for 1st arg' );
      assert && assert( !!b.equals, 'no equals function for 2nd arg' );
      assert && assert( a.equals( b ) === b.equals( a ), 'incompatible equality checks' );
      return a.equals( b );
    }
    else {

      // Reference equality for objects, value equality for primitives
      return a === b;
    }
  }

  /**
   * Directly notifies listeners of changes.
   * @private
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {

    // notify listeners, optionally detect loops where this TinyForwardingProperty is set again before this completes.
    this.emit( this.get(), oldValue, this );
  }

  // @public
  get value() {
    return this.get();
  }

  // @public
  set value( newValue ) { this.set( newValue ); }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   * @public
   */
  link( listener ) {
    this.addListener( listener );

    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the TinyForwardingProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @param {function} listener - a function with a single argument, which is the current value of the TinyForwardingProperty.
   * @public
   */
  lazyLink( listener ) {
    this.addListener( listener );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   *
   * @param {function} listener
   * @public
   */
  unlink( listener ) {
    this.removeListener( listener );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   * @public
   */
  unlinkAll() {
    this.removeAllListeners();
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using TinyForwardingProperty.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * @param object
   * @param attributeName
   * @public
   */
  linkAttribute( object, attributeName ) {
    const handle = value => {object[ attributeName ] = value;};
    this.link( handle );
    return handle;
  }

  /**
   * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
   * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
   *
   * @param {function} listener
   * @public
   */
  unlinkAttribute( listener ) {
    this.unlink( listener );
  }


  // @public Ensures that the TinyForwardingProperty is eligible for GC
  dispose() {
    // remove any listeners that are still attached to this property
    this.unlinkAll();

    super.dispose();
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
export default TinyForwardingProperty;