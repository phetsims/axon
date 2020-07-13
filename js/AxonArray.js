// Copyright 2020, University of Colorado Boulder

/**
 * AxonArray adds the ability to observe when items are added or removed from an Array. This was created as an
 * alternative to ObservableArray with the distinguishing change that this extends Array and hence uses the native
 * Array API.
 *
 * The only unsupported Array mutation feature is:
 *
 * myArray.length = 0;
 *
 * The Array.length prototype getter/property cannot be overridden and hence using this will lead to an inconsistent
 * state for the AxonArray.  Instead, please use setLengthAndNotify.
 *
 * There is no need to extend or mix-in PhetioObject since this is an uninstrumented intermediate node.  We don't need
 * any of the methods from ObservableArrayIO (they are handled by children) and we don't need any state from
 * ObservableArray (those cases should use PhetioGroup).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import ValidatorDef from './ValidatorDef.js';

class AxonArray extends Array {

  constructor( options ) {
    super();

    // Support construction via slice(), which invokes the sub-constructor
    if ( typeof options === 'number' ) {
      return;
    }

    options = merge( {
      tandem: Tandem.OPTIONAL,
      elementOptions: {
        // Supports validator keys, including phetioType (for instrumented instances)
      }
    }, options );

    // Gracefully support untyped values
    if ( !ValidatorDef.isValidValidator( options.elementOptions ) ) {
      options.elementOptions.isValidValue = () => true;
    }

    // @public - notifies when an item has been added
    this.itemAddedEmitter = new Emitter( {
      tandem: options.tandem.createTandem( 'itemAddedEmitter' ),
      parameters: [ merge( { name: 'value' }, options.elementOptions ) ]
    } );

    // @public - notifies when an item has been removed
    this.itemRemovedEmitter = new Emitter( {
      tandem: options.tandem.createTandem( 'itemRemovedEmitter' ),
      parameters: [ merge( { name: 'value' }, options.elementOptions ) ]
    } );

    // @public (read-only) observe this, but don't set it.  Updated when Array modifiers are called (except array.length=...)
    this.lengthProperty = new NumberProperty( 0, {
      numberType: 'Integer',
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      phetioReadOnly: true
    } );
  }

  /**
   * When an operation that can potentially change the Array is invoked, we first store a shallow copy of the Array
   * then send out notifications for items added/removed.  This supports adding/removing the same item multiple times.
   *
   * @param {Array} copy - a copy of the Array, made before an operation that mutates the Array is performed
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
   * Sets the Array length and notifies observers.
   *
   * The only unsupported Array mutation feature is:
   *
   * myArray.length = 0;
   *
   * The Array.length prototype getter/property cannot be overridden and hence using this will lead to an inconsistent
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
 * Counts the number of times an item appears in an Array, optimized for performance and called any time the Array
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