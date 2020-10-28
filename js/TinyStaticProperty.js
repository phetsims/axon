// Copyright 2020, University of Colorado Boulder

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
}

axon.register( 'TinyStaticProperty', TinyStaticProperty );
export default TinyStaticProperty;