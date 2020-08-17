// Copyright 2020, University of Colorado Boulder

/**
 * AxonArray adds the ability to observe when elements are added or removed from an Array. This was created as an
 * alternative to ObservableArray with the distinguishing change that this extends Array and hence uses the native
 * Array API.
 *
 * The unsupported Array mutation features are:
 *
 * array.length = ...
 * array.copyWithin(...)
 * array.fill(...)
 * array[i]=...
 *
 * The Array.length prototype getter/property cannot be overridden and hence using this will lead to an inconsistent
 * state for the AxonArray. Instead, please use setLengthAndNotify() or clear()
 *
 * There is no need to extend or mix-in PhetioObject since this is an uninstrumented intermediate node. We don't need
 * any of the methods from ObservableArrayIO (they are handled by children) and state is managed by a private
 * "implementation-detail" component called AxonArrayState
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import axon from './axon.js';
import AxonArrayState from './AxonArrayState.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';

class AxonArray extends Array {

  /**
   * @param {Object|number} [options] - {number} supports construction via splice(), which invokes the sub-constructor
   */
  constructor( options ) {

    // Support construction via Array.prototype.splice.apply(), etc., which invoke the sub-constructor
    if ( typeof options === 'number' ) {
      super( options );
      return;
    }

    super();

    if ( options && options.hasOwnProperty( 'length' ) ) {
      assert && assert( !options.hasOwnProperty( 'elements' ), 'options.elements and options.length are mutually exclusive' );
    }

    // If the options supplied the phetioElementType, it is passed through as a phetioType to the Emitter parameter
    const isPhetioElementTypeProvided = options && options.hasOwnProperty( 'phetioElementType' );

    options = merge( {
      length: 0,
      elements: [],
      tandem: Tandem.OPTIONAL,
      phetioElementType: ObjectIO,

      // The elementAddedEmitter and elementRemoveEmitter use this validator to check the validity ef elements,
      // Supports validator keys, like valueType, isValidValue, etc.  But we gracefully support untyped elements
      validator: { isValidValue: () => true }
    }, options );

    // @public - notifies when an element has been added
    const parameterOptions = merge( { name: 'value' }, options.validator );
    if ( isPhetioElementTypeProvided ) {
      parameterOptions.phetioType = options.phetioElementType;
    }
    this.elementAddedEmitter = new Emitter( {
      tandem: options.tandem.createTandem( 'elementAddedEmitter' ),
      parameters: [ parameterOptions ]
    } );

    // @public - notifies when an element has been removed
    this.elementRemovedEmitter = new Emitter( {
      tandem: options.tandem.createTandem( 'elementRemovedEmitter' ),
      parameters: [ parameterOptions ]
    } );

    // @public (read-only) observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
    this.lengthProperty = new NumberProperty( 0, {
      numberType: 'Integer',
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      phetioReadOnly: true
    } );

    // These options are mutually exclusive, but that is guarded before the mutate
    if ( options.length > 0 ) {
      this.setLengthAndNotify( options.length );
    }
    if ( options.elements.length > 0 ) {
      AxonArray.prototype.push.apply( this, options.elements );
    }

    // @private - for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    this.axonArrayState = new AxonArrayState( this, options );

    // @public (AxonArrayState,AxonArrayStateIO)
    this.phetioElementType = options.phetioElementType;
  }

  /**
   * Remove all elements from the array, this should be used instead of .length = 0 because that doesn't notify listeners
   * @public
   */
  clear() {
    this.setLengthAndNotify( 0 );
  }

  /**
   * Remove the first occurrence of the specified element, if any.  This is provided for compatibility with ObservableArray.
   * TODO: Should this be deprecated and eliminated?
   * @param {Object} element
   * @public
   */
  remove( element ) {
    arrayRemove( this, element );
  }

  /**
   * Gets the element at the specified index.  This is provided for compatibility with ObservableArray.
   * TODO: Should this be deprecated and eliminated?
   * @param {number} i
   * @returns {Object}
   * @public
   */
  get( i ) {
    return this[ i ];
  }

  /**
   * Adds all of the specified elements.  This is provided for compatibility with ObservableArray.
   * TODO: Should this be deprecated and eliminated?
   * @param {Object[]} elements
   * @public
   */
  addAll( elements ) {
    elements.forEach( e => this.push( e ) );
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
      this.lengthProperty.value = length;
      removedElements.forEach( removedElement => this.elementRemovedEmitter.emit( removedElement ) );
    }
    else if ( length > originalLength ) {
      this.length = length;
      this.lengthProperty.value = length;
      for ( let i = 0; i < length - originalLength; i++ ) {
        this.elementAddedEmitter.emit( undefined );
      }
    }
  }

  // @public
  push() {
    const result = Array.prototype.push.apply( this, arguments );

    // Gracefully support values created by axonArray.slice(), etc.
    if ( this.lengthProperty ) {
      this.lengthProperty.value = this.length;
      for ( let i = 0; i < arguments.length; i++ ) {
        this.elementAddedEmitter.emit( arguments[ i ] );
      }
    }
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

    // Gracefully support values created by axonArray.slice(), etc.
    if ( this.lengthProperty ) {
      this.lengthProperty.value = this.length;
      hasElement && this.elementRemovedEmitter.emit( removedElement );
    }
    return removedElement;
  }

  // @public
  shift() {
    const hasElement = this.length > 0;
    const removedElement = Array.prototype.shift.apply( this, arguments );

    // Gracefully support values created by axonArray.slice(), etc.
    if ( this.lengthProperty ) {
      this.lengthProperty.value = this.length;
      hasElement && this.elementRemovedEmitter.emit( removedElement );
    }
    return removedElement;
  }

  // @public
  splice() {
    const deletedElements = Array.prototype.splice.apply( this, arguments );

    // Gracefully support values created by axonArray.slice(), etc.
    if ( this.lengthProperty ) {
      this.lengthProperty.value = this.length;
      for ( let i = 2; i < arguments.length; i++ ) {
        this.elementAddedEmitter.emit( arguments[ i ] );
      }
      deletedElements.forEach( deletedElement => this.elementRemovedEmitter.emit( deletedElement ) );
    }
    return deletedElements;
  }

  // @public
  unshift() {
    const result = Array.prototype.unshift.apply( this, arguments );

    // Gracefully support values created by axonArray.slice(), etc.
    if ( this.lengthProperty ) {
      this.lengthProperty.value = this.length;
      for ( let i = 0; i < arguments.length; i++ ) {
        this.elementAddedEmitter.emit( arguments[ i ] );
      }
    }
    return result;
  }

  // @public
  dispose() {
    this.elementAddedEmitter.dispose();
    this.elementRemovedEmitter.dispose();
    this.lengthProperty.dispose();
    this.axonArrayState.dispose();
  }
}

axon.register( 'AxonArray', AxonArray );
export default AxonArray;