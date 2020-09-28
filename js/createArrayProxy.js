// Copyright 2020, University of Colorado Boulder

/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import ValidatorDef from './ValidatorDef.js';

/**
 * @param {Object} [options]
 * @returns {[]}
 */
const createArrayProxy = options => {

  assertMutuallyExclusiveOptions( options, [ 'length' ], [ 'elements' ] );

  //REVIEW https://github.com/phetsims/axon/issues/330 is phetioElementType a Core Type or an IO Type? Where is that validated?
  //REVIEW https://github.com/phetsims/axon/issues/330 is the last line of this comment dead code, or is it supposed to tell me something?
  // If the options supplied the phetioElementType, it is passed through as a phetioType to the Emitter parameter
  // const isPhetioElementTypeProvided = options && options.hasOwnProperty( 'phetioElementType' );

  options = merge( {

    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    tandem: Tandem.OPTIONAL
  }, options );

  let emitterParameterOptions = null;
  if ( options.phetioType ) {

    assert && assert( options.phetioType.typeName.startsWith( 'ArrayProxyIO' ) );
    emitterParameterOptions = { name: 'value', phetioType: options.phetioType.parameterTypes[ 0 ] };
  }
  else if ( ValidatorDef.isValidValidator( options ) ) {
    const validator = _.pick( options, ValidatorDef.VALIDATOR_KEYS );
    emitterParameterOptions = merge( { name: 'value' }, validator );
  }
  else {
    emitterParameterOptions = merge( { name: 'value' }, { isValidValue: _.stubTrue } );
  }

  // notifies when an element has been added
  const elementAddedEmitter = new Emitter( {
    tandem: options.tandem.createTandem( 'elementAddedEmitter' ),
    parameters: [ emitterParameterOptions ]
  } );

  // notifies when an element has been removed
  const elementRemovedEmitter = new Emitter( {
    tandem: options.tandem.createTandem( 'elementRemovedEmitter' ),
    parameters: [ emitterParameterOptions ]
  } );

  // observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty( 0, {
    numberType: 'Integer',
    tandem: options.tandem.createTandem( 'lengthProperty' ),
    phetioReadOnly: true
  } );

  //REVIEW https://github.com/phetsims/axon/issues/330 document targetArray
  const targetArray = [];

  //REVIEW https://github.com/phetsims/axon/issues/330 would @param doc make get/set/deleteProperty easier to read? I don't understand it because I'm not familiar with Proxy.
  const arrayProxy = new Proxy( targetArray, {

    get: function( target, key, receiver ) {
      if ( methods.hasOwnProperty( key ) ) {
        return methods[ key ];
      }
      else {
        return Reflect.get( target, key, receiver );
      }
    },

    set: function( array, key, newValue ) {
      const oldValue = array[ key ];

      let removedElements = null;

      // See which items are removed
      if ( key === 'length' ) {
        removedElements = array.slice( newValue );
      }

      const returnValue = Reflect.set( array, key, newValue );

      //REVIEW https://github.com/phetsims/axon/issues/330 I have no idea what's going on here. Why is key an int, and why do we need to parse it?
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

        assert && assert( removedElements, 'removedElements should be defined for key===length' );
        removedElements && removedElements.forEach( element => elementRemovedEmitter.emit( element ) );
      }
      return returnValue;
    },

    deleteProperty: function( array, key ) {
      //REVIEW https://github.com/phetsims/axon/issues/330 I have no idea what's going on here. Why is key an int, and why do we need to parse it?
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

  // @private - Make it possible to use the targetArray in the overridden methods above.
  arrayProxy.targetArray = targetArray;

  // @public (listen only)
  arrayProxy.elementAddedEmitter = elementAddedEmitter;
  arrayProxy.elementRemovedEmitter = elementRemovedEmitter;
  arrayProxy.lengthProperty = lengthProperty;

  if ( options.length >= 0 ) {
    arrayProxy.length = options.length;
  }
  if ( options.elements.length > 0 ) {
    Array.prototype.push.apply( arrayProxy, options.elements );
  }

  //TODO https://github.com/phetsims/axon/issues/330 Move to "prototype" above or drop support
  //REVIEW https://github.com/phetsims/axon/issues/330 Add reset tests to createArrayProxyTests. Does this behave correctly if I'm listening to lengthProperty?
  arrayProxy.reset = () => {
    arrayProxy.length = 0;
    if ( options.length >= 0 ) {
      arrayProxy.length = options.length;
    }
    if ( options.elements.length > 0 ) {
      Array.prototype.push.apply( arrayProxy, options.elements );
    }
  };

  /******************************************
   * PhET-iO support
   *******************************************/
  if ( options.tandem.supplied ) {
    arrayProxy.phetioElementType = options.phetioType.parameterTypes[ 0 ];

    // @private - for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    arrayProxy.arrayProxyPhetioObject = new ArrayProxyPhetioObject( arrayProxy, options );
  }

  return arrayProxy;
};

/**
 * Manages state save/load.  ArrayProxy uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 */
class ArrayProxyPhetioObject extends PhetioObject {

  /**
   * @param {ArrayProxyDef} arrayProxy
   * @param {Object} [options] - same as the options to the parent ArrayProxyDef
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

// Methods shared by all arrayProxy instances
const methods = {

  /******************************************
   * Overridden Array methods
   *******************************************/

  // @public
  pop() {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.pop.apply( this.targetArray, arguments );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  // @public
  shift() {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.shift.apply( this.targetArray, arguments );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  // @public
  push() {
    const returnValue = Array.prototype.push.apply( this.targetArray, arguments );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < arguments.length; i++ ) {
      this.elementAddedEmitter.emit( arguments[ i ] );
    }
    return returnValue;
  },

  // @public
  unshift() {
    const returnValue = Array.prototype.unshift.apply( this.targetArray, arguments );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < arguments.length; i++ ) {
      this.elementAddedEmitter.emit( arguments[ i ] );
    }
    return returnValue;
  },

  // @public
  splice() {
    const returnValue = Array.prototype.splice.apply( this.targetArray, arguments );

    //REVIEW https://github.com/phetsims/axon/issues/330 is this next comment true in general? Has that been thoroughly tested? Should this comment be moved to the header comment?
    // Set length first so it will be correct in elementListener callbacks
    this.lengthProperty.value = this.length;
    const deletedElements = returnValue;
    for ( let i = 2; i < arguments.length; i++ ) {
      this.elementAddedEmitter.emit( arguments[ i ] );
    }
    deletedElements.forEach( deletedElement => this.elementRemovedEmitter.emit( deletedElement ) );
    return returnValue;
  },

  // @public
  copyWithin() {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply( this.targetArray, arguments );
    reportDifference( before, this );
    return returnValue;
  },

  // @public
  fill() {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.fill.apply( this.targetArray, arguments );
    reportDifference( before, this );
    return returnValue;
  },

  /******************************************
   * For compatibility with ObservableArray
   * TODO https://github.com/phetsims/axon/issues/330 consider deleting after migration
   *******************************************/

  // @public
  get: function( index ) {return this[ index ];},

  // @public
  addItemAddedListener: function( listener ) { this.elementAddedEmitter.addListener( listener ); },

  // @public
  removeItemAddedListener: function( listener ) { this.elementAddedEmitter.removeListener( listener ); },

  // @public
  addItemRemovedListener: function( listener ) { this.elementRemovedEmitter.addListener( listener ); },

  // @public
  removeItemRemovedListener: function( listener ) { this.elementRemovedEmitter.removeListener( listener ); },

  // @public
  add: function( element ) { this.push( element );},

  // @public
  addAll: function( elements ) { this.push( ...elements );},

  // @public
  remove: function( element ) { this.includes( element ) && arrayRemove( this, element );},

  // @public
  removeAll: function( elements ) {
    elements.forEach( element => this.includes( element ) && arrayRemove( this, element ) );
  },

  // @public
  clear: function() {
    while ( this.length > 0 ) {
      this.pop();
    }
  },

  // @public
  count: function( predicate ) {
    let count = 0;
    for ( let i = 0; i < this.length; i++ ) {
      if ( predicate( this[ i ] ) ) {
        count++;
      }
    }
    return count;
  },

  // @public
  find: function( predicate, fromIndex ) {
    assert && ( fromIndex !== undefined ) && assert( typeof fromIndex === 'number', 'fromIndex must be numeric, if provided' );
    assert && ( typeof fromIndex === 'number' ) && assert( fromIndex >= 0 && fromIndex < this.length,
      `fromIndex out of bounds: ${fromIndex}` );
    return _.find( this, predicate, fromIndex );
  },

  // @public
  shuffle: function( random ) {
    assert && assert( random, 'random must be supplied' );

    // preserve the same _array reference in case any clients got a reference to it with getArray()
    const shuffled = random.shuffle( this );
    this.length = 0;
    Array.prototype.push.apply( this, shuffled );
  },

  // TODO https://github.com/phetsims/axon/issues/330 This seems important to eliminate
  // @public
  getArray: function() { return this; },

  //REVIEW https://github.com/phetsims/axon/issues/330 This also seems important to eliminate
  //REVIEW https://github.com/phetsims/axon/issues/330 do we need methods.slice?
  // @public
  getArrayCopy: function() { return this.slice(); },

  /******************************************
   * PhET-iO
   *******************************************/

  // @public
  toStateObject: function() {
    return { array: this.map( item => this.phetioElementType.toStateObject( item ) ) };
  },

  // @public
  applyState: function( stateObject ) {
    this.length = 0;
    const elements = stateObject.array.map( paramStateObject => this.phetioElementType.fromStateObject( paramStateObject ) );
    this.push( ...elements );
  },

  //REVIEW https://github.com/phetsims/axon/issues/330 dispose isn't specific to PhET-iO, move above the "PhET-iO" section comment?
  // @public
  dispose: function() {
    this.elementAddedEmitter.dispose();
    this.elementRemovedEmitter.dispose();
    this.lengthProperty.dispose();
    this.arrayProxyPhetioObject && this.arrayProxyPhetioObject.dispose();
  }
};

//REVIEW https://github.com/phetsims/axon/issues/330 I've read this comment multiple times and I'm still in the dark.
/**
 * Black box testing is less efficient but more concise and easy to verify correctness.  Used for the rarer methods.
 * @param {Object[]} shallowCopy
 * @param {ArrayProxyDef} arrayProxy
 */
const reportDifference = ( shallowCopy, arrayProxy ) => {

  const before = shallowCopy;
  const after = arrayProxy.targetArray.slice();

  for ( let i = 0; i < before.length; i++ ) {
    const beforeElement = before[ i ];
    const afterIndex = after.indexOf( beforeElement );
    if ( afterIndex >= 0 ) {
      before.splice( i, 1 );
      after.splice( afterIndex, 1 );
      i--;
    }
  }
  before.forEach( element => arrayProxy.elementRemovedEmitter.emit( element ) );
  after.forEach( element => arrayProxy.elementAddedEmitter.emit( element ) );
};

// {Map.<cacheKey:function(new:ArrayProxyIO), function(new:ArrayProxyIO)>} - Cache each parameterized ArrayProxyIO
// based on the parameter type, so that it is only created once.
const cache = new Map();

/**
 * ArrayProxyIO is the IO Type for ArrayProxyDef. It delegates most of its implementation to ArrayProxyDef.
 * Instead of being a parametric type, it leverages the phetioElementType on ArrayProxyDef.
 */
const ArrayProxyIO = parameterType => {
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `ArrayProxyIO<${parameterType.typeName}>`, {
      parameterTypes: [ parameterType ],
      valueType: ArrayProxyPhetioObject,
      toStateObject: arrayProxyPhetioObject => arrayProxyPhetioObject.arrayProxy.toStateObject(),
      applyState: ( arrayProxyPhetioObject, state ) => arrayProxyPhetioObject.arrayProxy.applyState( state )
    } ) );
  }
  return cache.get( parameterType );
};

// @public
createArrayProxy.ArrayProxyIO = ArrayProxyIO;

axon.register( 'createArrayProxy', createArrayProxy );
export default createArrayProxy;