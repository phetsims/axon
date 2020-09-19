// Copyright 2020, University of Colorado Boulder

/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import AxonArray from './AxonArray.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';

/**
 * @param {Object} [options]
 * @returns {[]}
 */
const createArrayProxy = options => {

  if ( options && options.hasOwnProperty( 'length' ) ) {
    assert && assert( !options.hasOwnProperty( 'elements' ), 'options.elements and options.length are mutually exclusive' );
  }

  // If the options supplied the phetioElementType, it is passed through as a phetioType to the Emitter parameter
  const isPhetioElementTypeProvided = options && options.hasOwnProperty( 'phetioElementType' );

  options = merge( {
    length: 0,
    elements: [],
    tandem: Tandem.OPTIONAL,
    phetioElementType: IOType.ObjectIO,
    phetioState: true,

    // The elementAddedEmitter and elementRemoveEmitter use this validator to check the validity ef elements,
    // Supports validator keys, like valueType, isValidValue, etc.  But we gracefully support untyped elements
    validator: { isValidValue: () => true }
  }, options );

  // @public - notifies when an element has been added
  const parameterOptions = merge( { name: 'value' }, options.validator );
  if ( isPhetioElementTypeProvided ) {
    parameterOptions.phetioType = options.phetioElementType;
  }
  const elementAddedEmitter = new Emitter( {
    tandem: options.tandem.createTandem( 'elementAddedEmitter' ),
    parameters: [ parameterOptions ]
  } );

  // @public - notifies when an element has been removed
  const elementRemovedEmitter = new Emitter( {
    tandem: options.tandem.createTandem( 'elementRemovedEmitter' ),
    parameters: [ parameterOptions ]
  } );

  // @public (read-only) observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty( 0, {
    numberType: 'Integer',
    tandem: options.tandem.createTandem( 'lengthProperty' ),
    phetioReadOnly: true
  } );

  const originalArray = [];

  const arrayProxy = new Proxy( originalArray, {
    get: function( target, key, receiver ) {
      const value = target[ key ];
      if ( typeof value !== 'function' ) {
        return value;
      }
      else {
        return function() {

          // console.log( `running ${key}`, arguments );
          const initialLength = originalArray.length;

          let shallowCopy;
          if ( key === 'copyWithin' || key === 'fill' ) {
            shallowCopy = originalArray.slice();
          }
          const returnValue = value.apply( originalArray, arguments );

          if ( key === 'splice' ) {

            // Set length first so it will be correct in elementListener callbacks
            this.lengthProperty.value = this.length;
            const deletedElements = returnValue;
            for ( let i = 2; i < arguments.length; i++ ) {
              this.elementAddedEmitter.emit( arguments[ i ] );
            }
            deletedElements.forEach( deletedElement => this.elementRemovedEmitter.emit( deletedElement ) );
          }
          else if ( key === 'push' ) {
            this.lengthProperty.value = this.length;
            for ( let i = 0; i < arguments.length; i++ ) {
              this.elementAddedEmitter.emit( arguments[ i ] );
            }
          }
          else if ( key === 'pop' ) {
            this.lengthProperty.value = this.length;
            // Supports notifying for [...,undefined].  TODO: or does it?
            initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
          }
          else if ( key === 'shift' ) {
            this.lengthProperty.value = this.length;
            initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
          }
          else if ( key === 'unshift' ) {
            this.lengthProperty.value = this.length;
            for ( let i = 0; i < arguments.length; i++ ) {
              this.elementAddedEmitter.emit( arguments[ i ] );
            }
          }
          else if ( key === 'copyWithin' || key === 'fill' ) {

            // black box testing is less efficient but more concise and easy to verify correctness.  Methods are on the rare side
            const before = shallowCopy;
            const after = originalArray.slice();

            for ( let i = 0; i < before.length; i++ ) {
              const beforeElement = before[ i ];
              const afterIndex = after.indexOf( beforeElement );
              if ( afterIndex >= 0 ) {
                before.splice( i, 1 );
                after.splice( afterIndex, 1 );
                i--;
              }
            }
            before.forEach( element => elementRemovedEmitter.emit( element ) );
            after.forEach( element => elementAddedEmitter.emit( element ) );
          }

          return returnValue;
        };
      }
    },
    set: function( array, key, newValue ) {
      const oldValue = array[ key ];
      // console.log( `Changing ${key} (type===${typeof key}), from ${oldValue} to ${newValue}` );

      let removedElements = null;
      // See which items are removed
      if ( key === 'length' ) {
        removedElements = array.slice( newValue );
      }

      const returnValue = Reflect.set( array, key, newValue );
      const parsed = parseInt( key, 10 );
      if ( !isNaN( parsed ) ) {
        if ( oldValue !== undefined ) {
          elementRemovedEmitter.emit( array[ key ] );
        }
        if ( newValue !== undefined ) {
          elementAddedEmitter.emit( newValue );
        }
      }
      else if ( key === 'length' ) {
        lengthProperty.value = newValue;

        removedElements.forEach( element => elementRemovedEmitter.emit( element ) );
      }
      return returnValue;
    },
    deleteProperty: function( array, key ) {
      // console.log( `deleteProperty ${key}, ${typeof key}` );
      const parsed = parseInt( key, 10 );

      let removed;
      if ( !isNaN( parsed ) ) {
        removed = array[ key ];
      }
      const returnValue = Reflect.deleteProperty( array, key );
      if ( removed !== undefined ) {
        elementRemovedEmitter.emit( removed );
      }

      return returnValue;
    }
  } );

  if ( options.length >= 0 ) {
    arrayProxy.length = options.length;
  }
  if ( options.elements.length > 0 ) {
    Array.prototype.push.apply( arrayProxy, options.elements );
  }

  // @public (listen only)
  arrayProxy.elementAddedEmitter = elementAddedEmitter;
  arrayProxy.elementRemovedEmitter = elementRemovedEmitter;
  arrayProxy.lengthProperty = lengthProperty;

  if ( options.tandem.supplied ) {
    arrayProxy.toStateObject = () => {
      // console.log( 'getting state' );
      const result = { array: arrayProxy.map( item => arrayProxy.phetioElementType.toStateObject( item ) ) };
      // console.log( result );
      return result;
    };

    // @public
    arrayProxy.applyState = stateObject => {
      arrayProxy.length = 0;
      const elements = stateObject.array.map( paramStateObject => arrayProxy.phetioElementType.fromStateObject( paramStateObject ) );
      arrayProxy.push( ...elements );
    };

    // @public
    arrayProxy.dispose = () => {
      this.elementAddedEmitter.dispose();
      this.elementRemovedEmitter.dispose();
      this.lengthProperty.dispose();
      this.axonArrayPhetioObject.dispose();
    };

    // @private - for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    arrayProxy.axonArrayPhetioObject = new ArrayProxyPhetioObject( arrayProxy, options );

    // @public (ArrayProxyPhetioObject,AxonArrayStateIO)
    arrayProxy.phetioElementType = options.phetioElementType;
  }

  return arrayProxy;
};

/**
 * Manages state save/load.  ArrayProxy uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 */
class ArrayProxyPhetioObject extends PhetioObject {

  /**
   * @param {Object} arrayProxy
   * @param {Object} [options] - same as the options to the parent AxonArray
   */
  constructor( arrayProxy, options ) {

    options = merge( {
      phetioType: ArrayProxyIO
    }, options );

    super( options );

    // @private
    this.arrayProxy = arrayProxy;
  }
}

// @public (read-only) (ArrayProxyIO)
AxonArray.ArrayProxyPhetioObject = ArrayProxyPhetioObject;

/**
 * ArrayProxyIO is the IO Type for AxonArray. It delegates most of its implementation to AxonArray.
 * Instead of being a parametric type, it leverages the phetioElementType on AxonArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const ArrayProxyIO = new IOType( 'ArrayProxyIO', {
  valueType: ArrayProxyPhetioObject,
  toStateObject: axonArrayPhetioObject => axonArrayPhetioObject.arrayProxy.toStateObject(),
  applyState: ( axonArrayPhetioObject, state ) => axonArrayPhetioObject.arrayProxy.applyState( state )
} );

axon.register( 'createArrayProxy', createArrayProxy );
export default createArrayProxy;