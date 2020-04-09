// Copyright 2013-2020, University of Colorado Boulder

/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

// Use inheritance instead of composition to save even more MB
class TinyStaticProperty extends TinyEmitter {

  /**
   * @param {*} value - the initial value of the property
   */
  constructor( value ) {

    super();

    // @private - Store the internal value and the initial value
    this._value = value;
  }

  /**
   * Gets the value.
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   * @public
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
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   *
   * @param {*} value
   * @protected - for overriding only
   */
  setPropertyValue( value ) {
    throw new Error( 'Cannot set a TinyStaticProperty value' );
  }

  /**
   * @param {*} oldValue
   * @private - but note that a few sims are calling this even though they shouldn't
   */
  _notifyListeners( oldValue ) {

    // notify listeners, optionally detect loops where this TinyStaticProperty is set again before this completes.
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

// static attributes
TinyStaticProperty.CHANGED_EVENT_NAME = 'changed';

axon.register( 'TinyStaticProperty', TinyStaticProperty );
export default TinyStaticProperty;