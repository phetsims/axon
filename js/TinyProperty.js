// Copyright 2020-2021, University of Colorado Boulder

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

class TinyProperty extends TinyEmitter {

  /**
   * @param {*} value - The initial value of the property
   * @param {function()} [onBeforeNotify]
   */
  constructor( value, onBeforeNotify ) {
    super( onBeforeNotify );

    // @protected {*} - Store the internal value
    this._value = value;

    // @protected {boolean|undefined} useDeepEquality - Forces use of the deep equality checks. Keeps some compatibility
    // with the Property interface to have the equality check in this type too. Not defining in the general case for
    // memory usage, only using if we notice this flag set.
  }

  /**
   * Returns the value.
   * @public
   *
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   *
   * @returns {*}
   */
  get() {
    return this._value;
  }

  /**
   * Returns the value.
   * @public
   *
   * @returns {*}
   */
  get value() {
    return this.get();
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   * @public
   *
   * @param {*} value
   * @returns {TinyProperty} this instance, for chaining.
   */
  set( value ) {
    if ( !this.equalsValue( value ) ) {
      const oldValue = this._value;

      this.setPropertyValue( value );

      this.notifyListeners( oldValue );
    }
    return this;
  }

  /**
   * Sets the value.
   * @public
   *
   * @param {*} newValue
   */
  set value( newValue ) {
    this.set( newValue );
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   * @public
   *
   * @param {*} value
   */
  setPropertyValue( value ) {
    this._value = value;
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   * @protected
   *
   * @param {*} value
   * @returns {boolean}
   */
  equalsValue( value ) {
    return this.areValuesEqual( value, this._value );
  }

  /**
   * Determines equality semantics for the wrapped type, including whether notifications are sent out when the
   * wrapped value changes, and whether onValue is triggered.
   * @public (Property)
   *
   * useDeepEquality: true => Use the `equals` method on the values
   * useDeepEquality: false => Use === for equality test
   *
   * Alternatively different implementation can be provided by subclasses or instances to change the equals
   * definition. See #10 and #73 and #115
   *
   * @param {*} a - should have the same type as TinyProperty element type
   * @param {*} b - should have the same type as TinyProperty element type
   * @returns {boolean}
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
   * @public
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {
    // We use this._value here for performance, AND to avoid calling onAccessAttempt unnecessarily.
    this.emit( this._value, oldValue, this );
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   * @public
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   */
  link( listener ) {
    this.addListener( listener );

    listener( this._value, null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the TinyProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @public
   *
   * @param {function} listener - a function with a single argument, which is the current value of the TinyProperty.
   */
  lazyLink( listener ) {
    this.addListener( listener );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   * @public
   *
   * @param {function} listener
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
   * Links an object's named attribute to this TinyProperty.  Returns a handle so it can be removed using
   * TinyProperty.unlink();
   * Example: modelVisibleProperty.linkAttribute(view, 'visible');
   *
   * NOTE: Duplicated with Property.linkAttribute
   * @public
   *
   * @param {*} object
   * @param {string} attributeName
   * @returns {function}
   */
  linkAttribute( object, attributeName ) {
    const handle = value => { object[ attributeName ] = value; };
    this.link( handle );
    return handle;
  }

  /**
   * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
   * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
   * @public
   *
   * @param {function} listener
   */
  unlinkAttribute( listener ) {
    this.unlink( listener );
  }

  /**
   * This is to build out the "Property-like" interface for usages that can take a TinyProperty or Property interchangably
   * @public
   * @returns {boolean} - always false
   */
  isPhetioInstrumented() {
    return false;
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   * @returns {boolean}
   * @public
   */
  isSettable() {
    return true;
  }

  /**
   * Releases references.
   * @public
   * @override
   */
  dispose() {
    // Remove any listeners that are still attached (note that the emitter dispose would do this also, but without the
    // potentially-needed extra logic of changeCount, etc.)
    this.unlinkAll();

    super.dispose();
  }
}

axon.register( 'TinyProperty', TinyProperty );
export default TinyProperty;