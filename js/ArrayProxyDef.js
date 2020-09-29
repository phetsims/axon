// Copyright 2020, University of Colorado Boulder

/**
 * This is a type definition for values returned by createArrayProxy.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';

//REVIEW https://github.com/phetsims/axon/issues/330 WebStorm is having problems with {ArrayProxyDef} vs {Array} params
/**
 * @typedef {Array} ArrayProxyDef
 * @property {Emitter} elementAddedEmitter
 * @property {Emitter} elementRemovedEmitter
 * @property {Property<Number>} lengthProperty
 * See createArrayProxy for details
 */
const ArrayProxyDef = {

  /**
   * Returns true if the argument has the properties that an Array Proxy should have.
   * @public
   */
  isArrayProxy( arrayProxy ) {

    return Array.isArray( arrayProxy ) && arrayProxy.elementAddedEmitter && arrayProxy.elementRemovedEmitter && arrayProxy.lengthProperty;
  }
};

axon.register( 'ArrayProxyDef', ArrayProxyDef );
export default ArrayProxyDef;