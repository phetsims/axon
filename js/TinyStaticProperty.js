// Copyright 2020, University of Colorado Boulder

/**
 * An observable stub which satisfies some of the Property interface, which can store a (static/constant) value
 * and also notify listeners when that value has mutated. The actual value reference does not change, however it can
 * itself be mutated.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyProperty from './TinyProperty.js';
import axon from './axon.js';

class TinyStaticProperty extends TinyProperty {
  /**
   * @param {*} value - The initial value of the property
   * @param {Object} [options] - options
   */
  constructor( value, options ) {
    super( value, options );
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   * @public
   * @override - Don't set the value of a TinyStaticProperty!
   *
   * @param {*} value
   * @returns {TinyStaticProperty} this instance, for chaining.
   */
  set( value ) {
    throw new Error( 'Cannot set a TinyStaticProperty value' );
  }
}

axon.register( 'TinyStaticProperty', TinyStaticProperty );
export default TinyStaticProperty;