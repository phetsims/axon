// Copyright 2020-2021, University of Colorado Boulder

/**
 * This is a type definition for values returned by createObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';

// TODO https://github.com/phetsims/axon/issues/331 WebStorm is having problems with {ObservableArrayDef} vs {Array} params
/**
 * @typedef {Array} ObservableArrayDef
 * @property {Emitter} elementAddedEmitter
 * @property {Emitter} elementRemovedEmitter
 * @property {Property.<Number>} lengthProperty
 * See createObservableArray for details
 */
const ObservableArrayDef = {

  /**
   * Returns true if the argument has the properties that an ObservableArrayDef should have.
   * @public
   *
   * @returns {boolean}
   */
  isObservableArray( observableArray ) {

    return Array.isArray( observableArray ) && observableArray.elementAddedEmitter && observableArray.elementRemovedEmitter && observableArray.lengthProperty;
  }
};

axon.register( 'ObservableArrayDef', ObservableArrayDef );
export default ObservableArrayDef;