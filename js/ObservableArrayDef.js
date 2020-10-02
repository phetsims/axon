// Copyright 2020, University of Colorado Boulder

/**
 * This is a type definition for values returned by createObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';

//REVIEW https://github.com/phetsims/axon/issues/330 WebStorm is having problems with {ObservableArrayDef} vs {Array} params
/**
 * @typedef {Array} ObservableArrayDef
 * @property {Emitter} elementAddedEmitter
 * @property {Emitter} elementRemovedEmitter
 * @property {Property<Number>} lengthProperty
 * See createObservableArray for details
 */
const ObservableArrayDef = {

  /**
   * Returns true if the argument has the properties that an Array Proxy should have.
   * @public
   */
  isArrayProxy( arrayProxy ) {

    return Array.isArray( arrayProxy ) && arrayProxy.elementAddedEmitter && arrayProxy.elementRemovedEmitter && arrayProxy.lengthProperty;
  }
};

axon.register( 'ObservableArrayDef', ObservableArrayDef );
export default ObservableArrayDef;