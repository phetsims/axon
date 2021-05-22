// Copyright 2020-2021, University of Colorado Boulder

/**
 * An observable stub which satisfies some of the Property interface, which can store a (static/constant) value
 * and also notify listeners when that value has mutated. The actual value reference does not change, however it can
 * itself be mutated.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import TinyProperty from './TinyProperty.js';

class TinyStaticProperty extends TinyProperty {

  /**
   * @param {*} value - The initial value of the property
   * @param {function} onAccessAttempt
   */
  constructor( value, onAccessAttempt ) {
    super( value );

    assert && assert( typeof onAccessAttempt === 'function' );

    // @private {function} - When set, it will be called whenever there is an attempt to read the value of this TinyStaticProperty.
    this.onAccessAttempt = onAccessAttempt;
  }

  /**
   * Returns the value. Overridden to support onAccessAttempt.
   * @public
   * @override
   *
   * @returns {*}
   */
  get() {
    this.onAccessAttempt();

    return super.get();
  }

  /**
   * Don't set the value of a TinyStaticProperty!
   * @public
   * @override
   *
   * @param {*} value
   */
  set( value ) {
    throw new Error( 'Cannot set a TinyStaticProperty value' );
  }

  /**
   * Returns true if the value can be set externally. Static Property values should only be mutated, not set.
   * @returns {boolean}
   * @override
   * @public
   */
  isSettable() {
    return false;
  }

  /**
   * Directly notifies listeners of changes.
   * @public
   * @override
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {

    // We use this.get() to ensure value is up to date with onAccessAttempt().
    this.emit( this.get(), oldValue, this );
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   * @public
   * @override
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   */
  link( listener ) {
    this.addListener( listener );

    // listener called with this.get() to ensure value is up to date with onAccessAttempt().
    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   * @protected
   * @override
   *
   * @param {*} value
   * @returns {boolean}
   */
  equalsValue( value ) {

    // checked with this.get() to ensure value is up to date with onAccessAttempt()
    return this.areValuesEqual( value, this.get() );
  }
}

axon.register( 'TinyStaticProperty', TinyStaticProperty );
export default TinyStaticProperty;