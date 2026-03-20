// Copyright 2020-2025, University of Colorado Boulder

/**
 * This is a type definition for values returned by createObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import axon from './axon.js';
import { type ObservableArray } from './createObservableArray.js';

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
   */
  isObservableArray( observableArray: ObservableArray<IntentionalAny> ): boolean {
    return !!( Array.isArray( observableArray ) && observableArray.elementAddedEmitter && observableArray.elementRemovedEmitter && observableArray.lengthProperty );
  }
};

axon.register( 'ObservableArrayDef', ObservableArrayDef );
export default ObservableArrayDef;