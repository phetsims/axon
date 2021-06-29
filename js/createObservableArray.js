// Copyright 2020-2021, University of Colorado Boulder

/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO. When an item
 * is added or removed, the lengthProperty changes before elementAddedEmitter or elementRemovedEmitter emit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import ValidatorDef from './ValidatorDef.js';

/**
 * @param {Object} [options]
 * @returns {ObservableArrayDef}
 */
const createObservableArray = options => {

  assertMutuallyExclusiveOptions( options, [ 'length' ], [ 'elements' ] );

  options = merge( {

    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    tandem: Tandem.OPTIONAL
  }, options );

  let emitterParameterOptions = null;
  if ( options.phetioType ) {

    assert && assert( options.phetioType.typeName.startsWith( 'ObservableArrayIO' ) );
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

  // The underlying array which is wrapped by the Proxy
  const targetArray = [];

  // Verify that lengthProperty is updated before listeners are notified, but not when setting PhET-iO State,
  // This is because we cannot specify ordering dependencies between Properties and ObservableArrays,
  // TODO: Maybe this can be improved when we have better support for this in https://github.com/phetsims/phet-io/issues/1661
  assert && elementAddedEmitter.addListener( () => {
    if ( assert ) {
      if ( !_.hasIn( window, 'phet.joist.sim' ) || !phet.joist.sim.isSettingPhetioStateProperty.value ) {
        assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while adding element' );
      }
    }
  } );
  assert && elementRemovedEmitter.addListener( () => {
    if ( assert ) {
      if ( !_.hasIn( window, 'phet.joist.sim' ) || !phet.joist.sim.isSettingPhetioStateProperty.value ) {
        assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while removing element' );
      }
    }
  } );

  // The Proxy which will intercept method calls and trigger notifications.
  const observableArray = new Proxy( targetArray, {

    /**
     * Trap for getting a property or method.
     * @param {Object[]} array - the targetArray
     * @param {string} key
     * @param {Object} receiver
     * @returns {*} - the requested value
     * @private
     */
    get: function( array, key, receiver ) {
      assert && assert( array === targetArray, 'array should match the targetArray' );
      if ( methods.hasOwnProperty( key ) ) {
        return methods[ key ];
      }
      else {
        return Reflect.get( array, key, receiver );
      }
    },

    /**
     * Trap for setting a property value.
     * @param {Object[]} array - the targetArray
     * @param {string} key
     * @param {*} newValue
     * @returns {boolean} - success
     * @private
     */
    set: function( array, key, newValue ) {
      assert && assert( array === targetArray, 'array should match the targetArray' );
      const oldValue = array[ key ];

      let removedElements = null;

      // See which items are removed
      if ( key === 'length' ) {
        removedElements = array.slice( newValue );
      }

      const returnValue = Reflect.set( array, key, newValue );

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number( key );
      if ( Number.isInteger( numberKey ) && numberKey >= 0 && oldValue !== newValue ) {
        lengthProperty.value = array.length;

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

    /**
     * This is the trap for the delete operator.
     * @param {Object[]} array - the targetArray
     * @param {string} key
     * @returns {boolean} - success
     * @private
     */
    deleteProperty: function( array, key ) {
      assert && assert( array === targetArray, 'array should match the targetArray' );

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number( key );

      let removed;
      if ( Number.isInteger( numberKey ) && numberKey >= 0 ) {
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
  observableArray.targetArray = targetArray;

  // @public (listen only)
  observableArray.elementAddedEmitter = elementAddedEmitter;
  observableArray.elementRemovedEmitter = elementRemovedEmitter;
  observableArray.lengthProperty = lengthProperty;

  const init = () => {
    if ( options.length >= 0 ) {
      observableArray.length = options.length;
    }
    if ( options.elements.length > 0 ) {
      Array.prototype.push.apply( observableArray, options.elements );
    }
  };

  init();

  //TODO https://github.com/phetsims/axon/issues/334 Move to "prototype" above or drop support
  observableArray.reset = () => {
    observableArray.length = 0;
    init();
  };

  /******************************************
   * PhET-iO support
   *******************************************/
  if ( options.tandem.supplied ) {
    observableArray.phetioElementType = options.phetioType.parameterTypes[ 0 ];

    // @private - for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    observableArray.observableArrayPhetioObject = new ObservableArrayPhetioObject( observableArray, options );
  }

  return observableArray;
};

/**
 * Manages state save/load. This implementation uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 * @private
 */
class ObservableArrayPhetioObject extends PhetioObject {

  /**
   * @param {ObservableArrayDef} observableArray
   * @param {Object} [options] - same as the options to the parent ObservableArrayDef
   */
  constructor( observableArray, options ) {

    options = merge( {
      phetioType: ObservableArrayIO
    }, options );

    super( options );

    // @private
    this.observableArray = observableArray;
  }
}

// Methods shared by all ObservableArrayDef instances
const methods = {

  /******************************************
   * Overridden Array methods
   *******************************************/

  // @public
  pop( ...args ) {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.pop.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  // @public
  shift( ...args ) {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.shift.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  // @public
  push( ...args ) {
    const returnValue = Array.prototype.push.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < arguments.length; i++ ) {
      this.elementAddedEmitter.emit( args[ i ] );
    }
    return returnValue;
  },

  // @public
  unshift( ...args ) {
    const returnValue = Array.prototype.unshift.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < args.length; i++ ) {
      this.elementAddedEmitter.emit( args[ i ] );
    }
    return returnValue;
  },

  // @public
  splice( ...args ) {
    const returnValue = Array.prototype.splice.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    const deletedElements = returnValue;
    for ( let i = 2; i < args.length; i++ ) {
      this.elementAddedEmitter.emit( args[ i ] );
    }
    deletedElements.forEach( deletedElement => this.elementRemovedEmitter.emit( deletedElement ) );
    return returnValue;
  },

  // @public
  copyWithin( ...args ) {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply( this.targetArray, args );
    reportDifference( before, this );
    return returnValue;
  },

  // @public
  fill( ...args ) {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.fill.apply( this.targetArray, args );
    reportDifference( before, this );
    return returnValue;
  },

  /******************************************
   * For compatibility with ObservableArrayDef
   * TODO https://github.com/phetsims/axon/issues/334 consider deleting after migration
   * TODO https://github.com/phetsims/axon/issues/334 if not deleted, rename 'Item' with 'Element'
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
  remove: function( element ) { arrayRemove( this, element );},

  // @public
  removeAll: function( elements ) {
    elements.forEach( element => arrayRemove( this, element ) );
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

    // Act on the targetArray so that removal and add notifications aren't sent.
    this.targetArray.length = 0;
    Array.prototype.push.apply( this.targetArray, shuffled );
  },

  // TODO https://github.com/phetsims/axon/issues/334 This also seems important to eliminate
  // @public
  getArrayCopy: function() { return this.slice(); },

  // @public
  dispose: function() {
    this.elementAddedEmitter.dispose();
    this.elementRemovedEmitter.dispose();
    this.lengthProperty.dispose();
    this.observableArrayPhetioObject && this.observableArrayPhetioObject.dispose();
  },

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
  }
};

/**
 * For copyWithin and fill, which have more complex behavior, we treat the array as a black box, making a shallow copy
 * before the operation in order to identify what has been added and removed.
 * @param {Object[]} shallowCopy
 * @param {ObservableArrayDef} observableArray
 */
const reportDifference = ( shallowCopy, observableArray ) => {

  const before = shallowCopy;
  const after = observableArray.targetArray.slice();

  for ( let i = 0; i < before.length; i++ ) {
    const beforeElement = before[ i ];
    const afterIndex = after.indexOf( beforeElement );
    if ( afterIndex >= 0 ) {
      before.splice( i, 1 );
      after.splice( afterIndex, 1 );
      i--;
    }
  }
  before.forEach( element => observableArray.elementRemovedEmitter.emit( element ) );
  after.forEach( element => observableArray.elementAddedEmitter.emit( element ) );
};

// {Map.<cacheKey:function(new:ObservableArrayIO), function(new:ObservableArrayIO)>} - Cache each parameterized ObservableArrayIO
// based on the parameter type, so that it is only created once.
const cache = new Map();

/**
 * ObservableArrayIO is the IO Type for ObservableArrayDef. It delegates most of its implementation to ObservableArrayDef.
 * Instead of being a parametric type, it leverages the phetioElementType on ObservableArrayDef.
 */
const ObservableArrayIO = parameterType => {
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArrayPhetioObject,
      parameterTypes: [ parameterType ],
      toStateObject: observableArrayPhetioObject => observableArrayPhetioObject.observableArray.toStateObject(),
      applyState: ( observableArrayPhetioObject, state ) => observableArrayPhetioObject.observableArray.applyState( state ),
      stateSchema: {
        array: ArrayIO( parameterType )
      }
    } ) );
  }
  return cache.get( parameterType );
};

// @public
createObservableArray.ObservableArrayIO = ObservableArrayIO;

axon.register( 'createObservableArray', createObservableArray );
export default createObservableArray;