// Copyright 2020-2023, University of Colorado Boulder

// createObservableArray conforms to the Proxy interface, which is polluted with `any` types.  Therefore we disable
// this rule for this file.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO. When an item
 * is added or removed, the lengthProperty changes before elementAddedEmitter or elementRemovedEmitter emit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize from '../../phet-core/js/optionize.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import Validation from './Validation.js';
import TEmitter from './TEmitter.js';

// NOTE: Is this up-to-date and correct? Looks like we tack on phet-io stuff depending on the phetioType.
type ObservableArrayListener<T> = ( element: T ) => void;
type Predicate<T> = ( element: T ) => boolean;
type ObservableArrayStateObject<T> = { array: any[] }; // eslint-disable-line -- futureproof type param if we type this
type FakeRandom<T> = { shuffle: ( arr: T[] ) => T[] }; // // We don't import because of the repo dependency
export type ObservableArrayOptions<T> = {
  length?: number;
  elements?: T[];
  hasListenerOrderDependencies?: boolean; // See TinyEmitter.hasListenerOrderDependencies
  tandem?: Tandem;

  // Possibly passed through to the Emitters
  phetioType?: IOType;
  phetioState?: boolean;
  phetioDocumentation?: string;
  phetioFeatured?: boolean;
};
type ObservableArray<T> = {
  get: ( index: number ) => T;
  addItemAddedListener: ( listener: ObservableArrayListener<T> ) => void;
  removeItemAddedListener: ( listener: ObservableArrayListener<T> ) => void;
  addItemRemovedListener: ( listener: ObservableArrayListener<T> ) => void;
  removeItemRemovedListener: ( listener: ObservableArrayListener<T> ) => void;
  add: ( element: T ) => void;
  addAll: ( elements: T[] ) => void;
  remove: ( element: T ) => void;
  removeAll: ( elements: T[] ) => void;
  clear: () => void;
  count: ( predicate: Predicate<T> ) => number;
  find: ( predicate: Predicate<T>, fromIndex?: number ) => T | undefined;
  shuffle: ( random: FakeRandom<T> ) => void;
  getArrayCopy: () => T[];
  dispose: () => void;
  toStateObject: () => ObservableArrayStateObject<T>;
  applyState: ( state: ObservableArrayStateObject<T> ) => void;

  // listen only please
  elementAddedEmitter: TEmitter<[ T ]>;
  elementRemovedEmitter: TEmitter<[ T ]>;
  lengthProperty: NumberProperty;

  //TODO https://github.com/phetsims/axon/issues/334 Move to "prototype" above or drop support
  reset: () => void;

  // Possibly passed through to the Emitter
  phetioElementType?: IOType;
} & T[];

// Typed for internal usage
type PrivateObservableArray<T> = {
  // Make it possible to use the targetArray in the overridden methods.
  targetArray: T[];

  _observableArrayPhetioObject?: ObservableArrayPhetioObject<T>;
} & ObservableArray<T>;

type SpecifiedObservableArrayOptions<T> = StrictOmit<ObservableArrayOptions<T>, 'phetioType' | 'phetioState' | 'phetioDocumentation'>;

const createObservableArray = <T>( providedOptions?: ObservableArrayOptions<T> ): ObservableArray<T> => {

  assertMutuallyExclusiveOptions( providedOptions, [ 'length' ], [ 'elements' ] );

  const options = optionize<ObservableArrayOptions<T>, SpecifiedObservableArrayOptions<T>>()( {

    hasListenerOrderDependencies: false,

    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    tandem: Tandem.OPTIONAL,
    phetioFeatured: false
  }, providedOptions );

  let emitterParameterOptions = null;
  if ( options.phetioType ) {

    assert && assert( options.phetioType.typeName.startsWith( 'ObservableArrayIO' ) );
    emitterParameterOptions = { name: 'value', phetioType: options.phetioType.parameterTypes![ 0 ] };
  }
  // NOTE: Improve with Validation
  else if ( !Validation.getValidatorValidationError( options ) ) {
    const validator = _.pick( options, Validation.VALIDATOR_KEYS );
    emitterParameterOptions = merge( { name: 'value' }, validator );
  }
  else {
    emitterParameterOptions = merge( { name: 'value' }, { isValidValue: _.stubTrue } );
  }

  // notifies when an element has been added
  const elementAddedEmitter = new Emitter<[ T ]>( {
    tandem: options.tandem.createTandem( 'elementAddedEmitter' ),
    parameters: [ emitterParameterOptions ],
    phetioReadOnly: true,
    phetioFeatured: options.phetioFeatured,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  } );

  // notifies when an element has been removed
  const elementRemovedEmitter = new Emitter<[ T ]>( {
    tandem: options.tandem.createTandem( 'elementRemovedEmitter' ),
    parameters: [ emitterParameterOptions ],
    phetioReadOnly: true,
    phetioFeatured: options.phetioFeatured,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  } );

  // observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty( 0, {
    numberType: 'Integer',
    tandem: options.tandem.createTandem( 'lengthProperty' ),
    phetioReadOnly: true,
    phetioFeatured: options.phetioFeatured
  } );

  // The underlying array which is wrapped by the Proxy
  const targetArray: T[] = [];

  // Verify that lengthProperty is updated before listeners are notified, but not when setting PhET-iO State,
  // This is because we cannot specify ordering dependencies between Properties and ObservableArrays,
  // TODO: Maybe this can be improved when we have better support for this in https://github.com/phetsims/phet-io/issues/1661
  assert && elementAddedEmitter.addListener( () => {
    if ( assert ) {
      const simGlobal = _.get( window, 'phet.joist.sim', null ); // returns null if global isn't found

      if ( !simGlobal || !simGlobal.isSettingPhetioStateProperty.value ) {
        assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while adding element' );
      }
    }
  } );
  assert && elementRemovedEmitter.addListener( () => {
    if ( assert ) {
      const simGlobal = _.get( window, 'phet.joist.sim', null ); // returns null if global isn't found

      if ( !simGlobal || !simGlobal.isSettingPhetioStateProperty.value ) {
        assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while removing element' );
      }
    }
  } );

  // The Proxy which will intercept method calls and trigger notifications.
  const observableArray: PrivateObservableArray<T> = new Proxy( targetArray, {

    /**
     * Trap for getting a property or method.
     * @param array - the targetArray
     * @param key
     * @param receiver
     * @returns - the requested value
     */
    get: function( array: T[], key: keyof typeof methods, receiver ): any {
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
     * @param array - the targetArray
     * @param key
     * @param newValue
     * @returns - success
     */
    set: function( array: T[], key: string | symbol, newValue: any ): boolean {
      assert && assert( array === targetArray, 'array should match the targetArray' );
      const oldValue = array[ key as any ];

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
          elementRemovedEmitter.emit( array[ key as any ] );
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
     */
    deleteProperty: function( array: T[], key: string | symbol ): boolean {
      assert && assert( array === targetArray, 'array should match the targetArray' );

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number( key );

      let removed;
      if ( Number.isInteger( numberKey ) && numberKey >= 0 ) {
        removed = array[ key as any ];
      }
      const returnValue = Reflect.deleteProperty( array, key );
      if ( removed !== undefined ) {
        elementRemovedEmitter.emit( removed );
      }

      return returnValue;
    }
  } ) as PrivateObservableArray<T>;

  observableArray.targetArray = targetArray;
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
    assert && assert( options.phetioType );

    observableArray.phetioElementType = options.phetioType!.parameterTypes![ 0 ];

    // for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    observableArray._observableArrayPhetioObject = new ObservableArrayPhetioObject( observableArray, options );
  }

  return observableArray;
};

/**
 * Manages state save/load. This implementation uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 */
class ObservableArrayPhetioObject<T> extends PhetioObject {

  // internal, don't use
  public observableArray: ObservableArray<T>;

  /**
   * @param observableArray
   * @param [providedOptions] - same as the options to the parent ObservableArrayDef
   */
  public constructor( observableArray: ObservableArray<T>, providedOptions?: ObservableArrayOptions<T> ) {

    super( providedOptions );

    this.observableArray = observableArray;
  }
}

// Methods shared by all ObservableArrayDef instances
const methods = {

  /******************************************
   * Overridden Array methods
   *******************************************/

  pop( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.pop.apply( thisArray.targetArray, args as any );
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  shift( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.shift.apply( thisArray.targetArray, args as any );
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.elementRemovedEmitter.emit( returnValue );
    return returnValue;
  },

  push( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const returnValue = Array.prototype.push.apply( thisArray.targetArray, args );
    thisArray.lengthProperty.value = thisArray.length;
    for ( let i = 0; i < arguments.length; i++ ) {
      thisArray.elementAddedEmitter.emit( args[ i ] );
    }
    return returnValue;
  },

  unshift( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const returnValue = Array.prototype.unshift.apply( thisArray.targetArray, args );
    thisArray.lengthProperty.value = thisArray.length;
    for ( let i = 0; i < args.length; i++ ) {
      thisArray.elementAddedEmitter.emit( args[ i ] );
    }
    return returnValue;
  },

  splice( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const returnValue = Array.prototype.splice.apply( thisArray.targetArray, args as any );
    thisArray.lengthProperty.value = thisArray.length;
    const deletedElements = returnValue;
    for ( let i = 2; i < args.length; i++ ) {
      thisArray.elementAddedEmitter.emit( args[ i ] );
    }
    deletedElements.forEach( deletedElement => thisArray.elementRemovedEmitter.emit( deletedElement ) );
    return returnValue;
  },

  copyWithin( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply( thisArray.targetArray, args as any );
    reportDifference( before, thisArray );
    return returnValue;
  },

  fill( ...args: any[] ): any {
    const thisArray = this as PrivateObservableArray<any>;

    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.fill.apply( thisArray.targetArray, args as any );
    reportDifference( before, thisArray );
    return returnValue;
  },

  /******************************************
   * For compatibility with ObservableArrayDef
   * TODO https://github.com/phetsims/axon/issues/334 consider deleting after migration
   * TODO https://github.com/phetsims/axon/issues/334 if not deleted, rename 'Item' with 'Element'
   *******************************************/
  get: function( index: number ) { return ( this as PrivateObservableArray<any> )[ index ]; },
  addItemAddedListener: function( listener: ObservableArrayListener<any> ) { ( this as PrivateObservableArray<any> ).elementAddedEmitter.addListener( listener ); },
  removeItemAddedListener: function( listener: ObservableArrayListener<any> ) { ( this as PrivateObservableArray<any> ).elementAddedEmitter.removeListener( listener ); },
  addItemRemovedListener: function( listener: ObservableArrayListener<any> ) { ( this as PrivateObservableArray<any> ).elementRemovedEmitter.addListener( listener ); },
  removeItemRemovedListener: function( listener: ObservableArrayListener<any> ) { ( this as PrivateObservableArray<any> ).elementRemovedEmitter.removeListener( listener ); },
  add: function( element: any ) { ( this as PrivateObservableArray<any> ).push( element );},
  addAll: function( elements: any[] ) { ( this as PrivateObservableArray<any> ).push( ...elements );},
  remove: function( element: any ) { arrayRemove( ( this as PrivateObservableArray<any> ), element );},
  removeAll: function( elements: any[] ) {
    elements.forEach( element => arrayRemove( ( this as PrivateObservableArray<any> ), element ) );
  },
  clear: function() {
    while ( ( this as PrivateObservableArray<any> ).length > 0 ) {
      ( this as PrivateObservableArray<any> ).pop();
    }
  },
  count: function( predicate: Predicate<any> ) {
    let count = 0;
    for ( let i = 0; i < ( this as PrivateObservableArray<any> ).length; i++ ) {
      if ( predicate( ( this as PrivateObservableArray<any> )[ i ] ) ) {
        count++;
      }
    }
    return count;
  },
  find: function( predicate: Predicate<any>, fromIndex?: number ) {
    assert && ( fromIndex !== undefined ) && assert( typeof fromIndex === 'number', 'fromIndex must be numeric, if provided' );
    assert && ( typeof fromIndex === 'number' ) && assert( fromIndex >= 0 && fromIndex < ( this as PrivateObservableArray<any> ).length,
      `fromIndex out of bounds: ${fromIndex}` );
    return _.find( ( this as PrivateObservableArray<any> ), predicate, fromIndex );
  },
  shuffle: function( random: FakeRandom<any> ) {
    assert && assert( random, 'random must be supplied' );

    // preserve the same _array reference in case any clients got a reference to it with getArray()
    const shuffled = random.shuffle( ( this as PrivateObservableArray<any> ) );

    // Act on the targetArray so that removal and add notifications aren't sent.
    ( this as PrivateObservableArray<any> ).targetArray.length = 0;
    Array.prototype.push.apply( ( this as PrivateObservableArray<any> ).targetArray, shuffled );
  },

  // TODO https://github.com/phetsims/axon/issues/334 This also seems important to eliminate
  getArrayCopy: function() { return ( this as PrivateObservableArray<any> ).slice(); },

  dispose: function() {
    const thisArray = this as PrivateObservableArray<any>;
    thisArray.elementAddedEmitter.dispose();
    thisArray.elementRemovedEmitter.dispose();
    thisArray.lengthProperty.dispose();
    thisArray._observableArrayPhetioObject && thisArray._observableArrayPhetioObject.dispose();
  },

  /******************************************
   * PhET-iO
   *******************************************/
  toStateObject: function() {
    return { array: ( this as PrivateObservableArray<any> ).map( item => ( this as PrivateObservableArray<any> ).phetioElementType!.toStateObject( item ) ) };
  },
  applyState: function( stateObject: ObservableArrayStateObject<any> ) {
    ( this as PrivateObservableArray<any> ).length = 0;
    const elements = stateObject.array.map( paramStateObject => ( this as PrivateObservableArray<any> ).phetioElementType!.fromStateObject( paramStateObject ) );
    this.push( ...elements );
  }
};

/**
 * For copyWithin and fill, which have more complex behavior, we treat the array as a black box, making a shallow copy
 * before the operation in order to identify what has been added and removed.
 */
const reportDifference = ( shallowCopy: any[], observableArray: PrivateObservableArray<any> ) => {

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
const ObservableArrayIO = ( parameterType: IOType ): IOType => {
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArrayPhetioObject,
      parameterTypes: [ parameterType ],
      toStateObject: ( observableArrayPhetioObject: ObservableArrayPhetioObject<any> ) => observableArrayPhetioObject.observableArray.toStateObject(),
      applyState: ( observableArrayPhetioObject: ObservableArrayPhetioObject<any>, state: ObservableArrayStateObject<any> ) => observableArrayPhetioObject.observableArray.applyState( state ),
      stateSchema: {
        array: ArrayIO( parameterType )
      }
    } ) );
  }
  return cache.get( parameterType );
};

createObservableArray.ObservableArrayIO = ObservableArrayIO;

axon.register( 'createObservableArray', createObservableArray );
export default createObservableArray;
export { ObservableArrayIO };
export type { ObservableArray };
