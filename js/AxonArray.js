// Copyright 2020, University of Colorado Boulder

/**
 * Adds ability to observe when items are added or removed from an array. This was created as an alternative to
 * ObservableArray with the distinguishing change that this extends Array and hence uses the native Array API.
 * The only unsupported array mutation feature is:
 *
 * myArray.length = 0;
 *
 * The Array.length prototype getter/property cannot be overridden and hence using this will lead to an inconsistent
 * state for the AxonArray.  Instead, please use setLengthAndNotify.
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';

class AxonArray extends Array {

  constructor() {
    super();

    // TODO: validator should be an option - see https://github.com/phetsims/axon/issues/308
    // TODO: optional phet-io instrumentation for children - see https://github.com/phetsims/axon/issues/308
    // TODO: do we need PhetioObject mixin? - see https://github.com/phetsims/axon/issues/308
    this.itemAddedEmitter = new Emitter( {
      parameters: [ { isValidValue: x => true } ]
    } );
    this.itemRemovedEmitter = new Emitter( {
      parameters: [ { isValidValue: x => true } ]
    } );

    // TODO: How to make this read-only? - see https://github.com/phetsims/axon/issues/308
    this.lengthProperty = new NumberProperty( 0 ); // read-only
  }

  /**
   * When an operation that can potentially change the array is invoked, we first store a shallow copy of the array
   * then send out notifications for items added/removed.  This supports adding/removing the same item multiple times.
   * @private
   */
  notifyChanges( copy ) {

    const set = new Set();
    copy.forEach( item => set.add( item ) );
    this.forEach( item => set.add( item ) );
    set.forEach( item => {

      const before = countMatches( copy, item );
      const after = countMatches( this, item );

      if ( after > before ) {
        _.times( after - before, () => this.itemAddedEmitter.emit( item ) );
      }
      else if ( after < before ) {
        _.times( before - after, () => this.itemRemovedEmitter.emit( item ) );
      }
    } );
    this.lengthProperty.value = this.length;
  }

  /**
   *  The only unsupported array mutation feature is:
   *
   * myArray.length = 0;
   *
   * The Array.length prototype getter/property cannot be overriden and hence using this will lead to an inconsistent
   * state for the AxonArray.  Instead, please use setLengthAndNotify.
   * @param {number} length
   * @public
   */
  setLengthAndNotify( length ) {
    const copy = this.slice();
    this.length = length;
    this.notifyChanges( copy );
  }

  // @public
  push() {
    const copy = this.slice();
    const result = Array.prototype.push.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  copyWithin() {
    const copy = this.slice();
    const result = Array.prototype.copyWithin.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  fill() {
    const copy = this.slice();
    const result = Array.prototype.fill.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  pop() {
    const copy = this.slice();
    const result = Array.prototype.pop.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  reverse() {
    const copy = this.slice();
    const result = Array.prototype.reverse.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  shift() {
    const copy = this.slice();
    const result = Array.prototype.shift.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  slice() {
    const copy = super.slice();
    const result = Array.prototype.slice.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  splice() {
    const copy = super.slice();
    const result = Array.prototype.splice.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }

  // @public
  unshift() {
    const copy = super.slice();
    const result = Array.prototype.unshift.apply( this, arguments );
    this.notifyChanges( copy );
    return result;
  }
}

/**
 * Counts the number of times an item appears in an array, optimized for performance and called any time the array
 * can be mutated.
 * @param {Array} array
 * @param {*} item
 * @returns {number}
 * @private
 */
const countMatches = ( array, item ) => {
  let count = 0;
  for ( let i = 0; i < array.length; i++ ) {
    if ( array[ i ] === item ) {
      count++;
    }
  }
  return count;
};

axon.register( 'AxonArray', AxonArray );
export default AxonArray;