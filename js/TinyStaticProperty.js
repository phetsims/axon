// Copyright 2013-2020, University of Colorado Boulder

/**
 * An observable stub which satisfies some of the Property interface, which can store a (static/constant) value
 * and also notify listeners when that value has mutated.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

// Inheritance saves memory
class TinyStaticProperty extends TinyEmitter {
  /**
   * @param {*} value - the initial value of the property
   */
  constructor( value ) {
    super();

    // @private {*} - Store the internal value
    this._value = value;
  }

  /**
   * Gets the value.
   * @public
   *
   * @returns {*}
   */
  get() {
    return this._value;
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * @param {*} value
   * @returns {TinyStaticProperty} this instance, for chaining.
   * @public
   */
  set( value ) {
    throw new Error( 'Cannot set a TinyStaticProperty value' );
  }

  /**
   * Directly notifies listeners of changes.
   * @public
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {
    this.emit( this._value, oldValue, this );
  }

  // @public
  get value() { return this._value; }

  // @public
  set value( newValue ) {
    throw new Error( 'Cannot set a TinyStaticProperty value' );
  }

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
   * Add an listener to the TinyStaticProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @param {function} listener - a function with a single argument, which is the current value of the TinyStaticProperty.
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
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using TinyStaticProperty.unlink();
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


  // @public Ensures that the TinyStaticProperty is eligible for GC
  dispose() {
    // remove any listeners that are still attached to this property
    this.unlinkAll();

    super.dispose();
  }
}

axon.register( 'TinyStaticProperty', TinyStaticProperty );
export default TinyStaticProperty;