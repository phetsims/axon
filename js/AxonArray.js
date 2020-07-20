// Copyright 2020, University of Colorado Boulder

/**
 * AxonArray adds the ability to observe when items are added or removed from an Array. This was created as an
 * alternative to ObservableArray with the distinguishing change that this extends Array and hence uses the native
 * Array API.
 *
 * The unsupported Array mutation features are:
 *
 * array.length = ...
 * array.copyWithin(...)
 * array.fill(...)
 *
 * The Array.length prototype getter/property cannot be overridden and hence using this will lead to an inconsistent
 * state for the AxonArray. Instead, please use setLengthAndNotify.
 *
 * There is no need to extend or mix-in PhetioObject since this is an uninstrumented intermediate node. We don't need
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

    // @public (read-only) observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
    this.lengthProperty = new NumberProperty( 0, {
      numberType: 'Integer',
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      phetioReadOnly: true
    } );
  }

  /**
   * Array.length is not supported. The Array.length getter cannot be overridden, so we have no way to prevent its use.
   * Using it this will lead to an inconsistent state for the AxonArray. Instead, please use setLengthAndNotify.
   * @param {number} length
   * @public
   */
  setLengthAndNotify( length ) {
    const originalLength = this.length;
    if ( length === originalLength ) {
      // no-op
    }
    else if ( length < originalLength ) {
      const removedElements = this.slice( length );
      this.length = length;
      removedElements.forEach( removedElement => this.itemRemovedEmitter.emit( removedElement ) );
    }
    else if ( length > originalLength ) {
      this.length = length;
      for ( let i = 0; i < length - originalLength; i++ ) {
        this.itemAddedEmitter.emit( undefined );
      }
    }
    this.lengthProperty.value = length;
  }

  // @public
  push() {
    const result = Array.prototype.push.apply( this, arguments );
    for ( let i = 0; i < arguments.length; i++ ) {
      this.itemAddedEmitter.emit( arguments[ i ] );
    }
    this.lengthProperty.value = this.length;
    return result;
  }

  // @public
  copyWithin() {
    throw new Error( 'AxonArray.copyWithin is not implemented' );
  }

  // @public
  fill() {
    throw new Error( 'AxonArray.fill is not implemented' );
  }

  // @public
  pop() {

    // Supports notifying for [...,undefined]
    const hasElement = this.length > 0;
    const removedElement = Array.prototype.pop.apply( this, arguments );
    hasElement && this.itemRemovedEmitter.emit( removedElement );
    this.lengthProperty.value = this.length;
    return removedElement;
  }

  // @public
  shift() {
    const hasElement = this.length > 0;
    const removedElement = Array.prototype.shift.apply( this, arguments );
    hasElement && this.itemRemovedEmitter.emit( removedElement );
    this.lengthProperty.value = this.length;
    return removedElement;
  }

  // @public
  splice() {
    const deletedElements = Array.prototype.splice.apply( this, arguments );

    for ( let i = 2; i < arguments.length; i++ ) {
      this.itemAddedEmitter.emit( arguments[ i ] );
    }
    deletedElements.forEach( deletedItem => this.itemRemovedEmitter.emit( deletedItem ) );
    this.lengthProperty.value = this.length;
    return deletedElements;
  }

  // @public
  unshift() {
    const result = Array.prototype.push.apply( this, arguments );
    for ( let i = 0; i < arguments.length; i++ ) {
      this.itemAddedEmitter.emit( arguments[ i ] );
    }
    this.lengthProperty.value = this.length;
    return result;
  }
}

axon.register( 'AxonArray', AxonArray );
export default AxonArray;