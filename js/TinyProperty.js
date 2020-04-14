// Copyright 2020, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

// Inheritance saves memory
class TinyProperty extends TinyEmitter {

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
    // whenever there is an attempt to read the value of this TinyProperty.
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
    return this._value;
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * @param {*} value
   * @returns {TinyProperty} this instance, for chaining.
   * @public
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
   * @param {Object} value
   * @returns {boolean}
   * @protected
   */
  equalsValue( value ) {
    return this.areValuesEqual( value, this._value );
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
   * @param {Object} a - should have the same type as TinyProperty element type
   * @param {Object} b - should have the same type as TinyProperty element type
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
   * @public
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {

    // notify listeners, optionally detect loops where this TinyProperty is set again before this completes.
    this.emit( this._value, oldValue, this );
  }

  // @public
  get value() {
    this.onAccessAttempt && this.onAccessAttempt();
    return this._value;
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

    listener( this._value, null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the TinyProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @param {function} listener - a function with a single argument, which is the current value of the TinyProperty.
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
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using TinyProperty.unlink();
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


  // @public Ensures that the TinyProperty is eligible for GC
  dispose() {
    // remove any listeners that are still attached to this property
    this.unlinkAll();

    super.dispose();
  }
}

axon.register( 'TinyProperty', TinyProperty );
export default TinyProperty;