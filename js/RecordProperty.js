// Copyright 2020, University of Colorado Boulder

/**
 * A lightweight Property interface implementation that stores its data in a Record. Forwards most things directly to
 * the Record.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

class RecordProperty extends TinyEmitter {
  /**
   * @param {Record} record
   * @param {string} propertyName
   */
  constructor( record, propertyName ) {
    super();

    // @private {Record}
    this.record = record;

    // @private {string}
    this.propertyName = propertyName;
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
    return this.record._get_( this.propertyName );
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
   * @returns {RecordProperty} this instance, for chaining.
   */
  set( value ) {
    this.record._set_( this.propertyName, value );
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
   * Directly notifies listeners of changes.
   * @public (axon-internal)
   *
   * @param {*} value
   * @param {*} oldValue
   */
  notifyListeners( value, oldValue ) {
    this.emit( value, oldValue, this );
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

    listener( this.value, null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the RecordProperty, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @public
   *
   * @param {function} listener - a function with a single argument, which is the current value of the RecordProperty.
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
   * Links an object's named attribute to this RecordProperty.  Returns a handle so it can be removed using
   * RecordProperty.unlink();
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
   * This is to build out the "Property-like" interface for usages that can take a RecordProperty or Property interchangably
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

axon.register( 'RecordProperty', RecordProperty );
export default RecordProperty;