// Copyright 2020-2025, University of Colorado Boulder

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
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import type StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
import { type PhetioState } from '../../tandem/js/phet-io-types.js';
import PhetioObject, { type PhetioObjectOptions } from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType, { AnyIOType } from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter, { type EmitterOptions } from './Emitter.js';
import NumberProperty, { type NumberPropertyOptions } from './NumberProperty.js';
import type TEmitter from './TEmitter.js';
import Validation from './Validation.js';

// NOTE: Is this up-to-date and correct? Looks like we tack on phet-io stuff depending on the phetioType.
type ObservableArrayListener<T> = ( element: T ) => void;
type Predicate<T> = ( element: T ) => boolean;
type ObservableArrayState<T> = { array: any[] }; // eslint-disable-line -- futureproof type param if we type this
type FakeRandom<T> = { shuffle: ( arr: T[] ) => T[] }; // // We don't import because of the repo dependency
type SelfOptions<T> = {
  length?: number;
  elements?: T[];
  hasListenerOrderDependencies?: boolean; // See TinyEmitter.hasListenerOrderDependencies

  // Options for the array's child elements. Omitted options are the responsibility of the array.
  elementAddedEmitterOptions?: StrictOmit<EmitterOptions, 'tandem' | 'parameters' | 'phetioReadOnly'>;
  elementRemovedEmitterOptions?: StrictOmit<EmitterOptions, 'tandem' | 'parameters' | 'phetioReadOnly'>;
  lengthPropertyOptions?: StrictOmit<NumberPropertyOptions, 'tandem' | 'numberType' | 'phetioReadOnly'>;
};
export type ObservableArrayOptions<T> = SelfOptions<T> & PhetioObjectOptions;

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
  toStateObject: () => ObservableArrayState<T>;
  applyState: ( state: ObservableArrayState<T> ) => void;

  // listen only please
  elementAddedEmitter: TEmitter<[ T ]>;
  elementRemovedEmitter: TEmitter<[ T ]>;
  lengthProperty: NumberProperty;

  //TODO https://github.com/phetsims/axon/issues/334 Move to "prototype" above or drop support
  reset: () => void;

  // Possibly passed through to the Emitter
  phetioElementType?: AnyIOType;
} & T[];

// Typed for internal usage
type PrivateObservableArray<T> = {
  // Make it possible to use the targetArray in the overridden methods.
  targetArray: T[];

  _observableArrayPhetioObject?: ObservableArrayPhetioObject<T>;

  // keep track of listeners to be called while deferred
  deferredActions: VoidFunction[];
  notificationsDeferred: boolean;
  emitNotification: ( emitter: TEmitter<[ T ]>, element: T ) => void;
  setNotificationsDeferred( notificationsDeferred: boolean ): void;
} & ObservableArray<T>;


const createObservableArray = <T>( providedOptions?: ObservableArrayOptions<T> ): ObservableArray<T> => {

  assertMutuallyExclusiveOptions( providedOptions, [ 'length' ], [ 'elements' ] );

  const options = optionize<ObservableArrayOptions<T>, SelfOptions<T>, PhetioObjectOptions>()( {

    hasListenerOrderDependencies: false,

    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    elementAddedEmitterOptions: {},
    elementRemovedEmitterOptions: {},
    lengthPropertyOptions: {}
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
  const elementAddedEmitter = new Emitter<[ T ]>( combineOptions<EmitterOptions>( {
    tandem: options.tandem?.createTandem( 'elementAddedEmitter' ),
    parameters: [ emitterParameterOptions ],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementAddedEmitterOptions ) );

  // notifies when an element has been removed
  const elementRemovedEmitter = new Emitter<[ T ]>( combineOptions<EmitterOptions>( {
    tandem: options.tandem?.createTandem( 'elementRemovedEmitter' ),
    parameters: [ emitterParameterOptions ],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementRemovedEmitterOptions ) );

  // observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty( 0, combineOptions<NumberPropertyOptions>( {
    numberType: 'Integer',
    tandem: options.tandem?.createTandem( 'lengthProperty' ),
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.lengthPropertyOptions ) );

  // The underlying array which is wrapped by the Proxy
  const targetArray: T[] = [];

  // Verify that lengthProperty is updated before listeners are notified, but not when setting PhET-iO State,
  // This is because we cannot specify ordering dependencies between Properties and ObservableArrays,
  assert && elementAddedEmitter.addListener( () => {
    if ( !isSettingPhetioStateProperty.value ) {
      assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while adding element' );
    }
  } );
  assert && elementRemovedEmitter.addListener( () => {
    if ( !isSettingPhetioStateProperty.value ) {
      assert && assert( lengthProperty.value === targetArray.length, 'lengthProperty out of sync while removing element' );
    }
  } );

  const deferredActions: VoidFunction[] = [];
  const emitNotification = ( emitter: TEmitter<[ T ]>, element: T ) => {
    if ( observableArray.notificationsDeferred ) {
      observableArray.deferredActions.push( () => emitter.emit( element ) );
    }
    else {
      emitter.emit( element );
    }
  };

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
          emitNotification( elementRemovedEmitter, array[ key as any ] );
        }
        if ( newValue !== undefined ) {
          emitNotification( elementAddedEmitter, newValue );
        }
      }
      else if ( key === 'length' ) {
        lengthProperty.value = newValue;

        assert && assert( removedElements, 'removedElements should be defined for key===length' );
        removedElements && removedElements.forEach( element => emitNotification( elementRemovedEmitter, element ) );
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
        emitNotification( elementRemovedEmitter, removed );
      }

      return returnValue;
    }
  } ) as PrivateObservableArray<T>;

  // private
  observableArray.targetArray = targetArray;
  observableArray.notificationsDeferred = false;
  observableArray.emitNotification = emitNotification;
  observableArray.deferredActions = deferredActions;

  // public
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
  if ( options.tandem?.supplied ) {
    assert && assert( options.phetioType );

    observableArray.phetioElementType = options.phetioType.parameterTypes![ 0 ];

    // for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    observableArray._observableArrayPhetioObject = new ObservableArrayPhetioObject( observableArray, options );

    if ( Tandem.PHET_IO_ENABLED ) {

      assert && assert( _.hasIn( window, 'phet.phetio.phetioEngine.phetioStateEngine' ),
        'PhET-iO Instrumented ObservableArrays must be created once phetioEngine has been constructed' );

      const phetioStateEngine = phet.phetio.phetioEngine.phetioStateEngine;

      // On state start, clear out the container and set to defer notifications.
      phetioStateEngine.clearDynamicElementsEmitter.addListener( ( state: PhetioState, scopeTandem: Tandem ) => {

        // Only clear if this PhetioDynamicElementContainer is in scope of the state to be set
        if ( observableArray._observableArrayPhetioObject?.tandem.hasAncestor( scopeTandem ) ) {

          // Clear before deferring, so that removal notifications occur eagerly before state set.
          observableArray.length = 0;

          observableArray.setNotificationsDeferred( true );
        }
      } );

      // done with state setting
      phetioStateEngine.undeferEmitter.addListener( () => {
        if ( observableArray.notificationsDeferred ) {
          observableArray.setNotificationsDeferred( false );
        }
      } );

      // It is possible and often that ObservableArray listeners are responsible for creating dynamic elements, and so
      // we cannot assume that all listeners can be deferred until after setting values. This prevents "impossible set state. . ."
      // assertions.
      phetioStateEngine.addSetStateHelper( () => {

        // If we have any deferred actions at this point, execute one. Then the PhET-iO State Engine can ask for more
        // if needed next time. It may be better at some point to do more than just one action here (for performance),
        // but it is a balance. Actions here may also have an order dependency expecting a Property to have its new
        // value already, so one at a time seems best for now. Note that PhetioDynamicElementContainer elects to fire
        // as many as possible, since it is more likely that the creation of one dynamic element would cause the
        // creation of another (model element -> view element).
        if ( observableArray.deferredActions.length > 0 ) {
          observableArray.deferredActions.shift()!();
          return true;
        }
        else {
          return false;
        }
      } );
    }
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
const methods: ThisType<PrivateObservableArray<unknown>> = {

  /******************************************
   * Overridden Array methods
   *******************************************/

  pop( ...args: any[] ): any {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.pop.apply( this.targetArray, args as any );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.emitNotification( this.elementRemovedEmitter, returnValue );
    return returnValue;
  },

  shift( ...args: any[] ): any {
    const initialLength = this.targetArray.length;
    const returnValue = Array.prototype.shift.apply( this.targetArray, args as any );
    this.lengthProperty.value = this.length;
    initialLength > 0 && this.emitNotification( this.elementRemovedEmitter, returnValue );
    return returnValue;
  },

  push( ...args: any[] ): any {
    const returnValue = Array.prototype.push.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < arguments.length; i++ ) {
      this.emitNotification( this.elementAddedEmitter, args[ i ] );
    }
    return returnValue;
  },

  unshift( ...args: any[] ): any {
    const returnValue = Array.prototype.unshift.apply( this.targetArray, args );
    this.lengthProperty.value = this.length;
    for ( let i = 0; i < args.length; i++ ) {
      this.emitNotification( this.elementAddedEmitter, args[ i ] );
    }
    return returnValue;
  },

  splice( ...args: any[] ): any {
    const returnValue = Array.prototype.splice.apply( this.targetArray, args as any );
    this.lengthProperty.value = this.length;
    const deletedElements = returnValue;
    for ( let i = 2; i < args.length; i++ ) {
      this.emitNotification( this.elementAddedEmitter, args[ i ] );
    }
    deletedElements.forEach( deletedElement => this.emitNotification( this.elementRemovedEmitter, deletedElement ) );
    return returnValue;
  },

  copyWithin( ...args: any[] ): any {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply( this.targetArray, args as any );
    reportDifference( before, this );
    return returnValue;
  },

  fill( ...args: any[] ): any {
    const before = this.targetArray.slice();
    const returnValue = Array.prototype.fill.apply( this.targetArray, args as any );
    reportDifference( before, this );
    return returnValue;
  },

  /******************************************
   * For compatibility with ObservableArrayDef
   * TODO https://github.com/phetsims/axon/issues/334 consider deleting after migration
   * TODO https://github.com/phetsims/axon/issues/334 if not deleted, rename 'Item' with 'Element'
   *******************************************/
  get: function( index: number ) { return this[ index ]; },
  addItemAddedListener: function( listener: ObservableArrayListener<any> ) { this.elementAddedEmitter.addListener( listener ); },
  removeItemAddedListener: function( listener: ObservableArrayListener<any> ) { this.elementAddedEmitter.removeListener( listener ); },
  addItemRemovedListener: function( listener: ObservableArrayListener<any> ) { this.elementRemovedEmitter.addListener( listener ); },
  removeItemRemovedListener: function( listener: ObservableArrayListener<any> ) { this.elementRemovedEmitter.removeListener( listener ); },
  add: function( element: any ) { this.push( element ); },
  addAll: function( elements: any[] ) { this.push( ...elements ); },
  remove: function( element: any ) { arrayRemove( this, element ); },
  removeAll: function( elements: any[] ) {
    elements.forEach( element => arrayRemove( this, element ) );
  },
  clear: function() {
    while ( this.length > 0 ) {
      this.pop();
    }
  },
  count: function( predicate: Predicate<any> ) {
    let count = 0;
    for ( let i = 0; i < this.length; i++ ) {
      if ( predicate( this[ i ] ) ) {
        count++;
      }
    }
    return count;
  },
  find: function( predicate: Predicate<any>, fromIndex?: number ) {
    assert && ( fromIndex !== undefined ) && assert( typeof fromIndex === 'number', 'fromIndex must be numeric, if provided' );
    assert && ( typeof fromIndex === 'number' ) && assert( fromIndex >= 0 && fromIndex < this.length,
      `fromIndex out of bounds: ${fromIndex}` );
    return _.find( this, predicate, fromIndex );
  },
  shuffle: function( random: FakeRandom<any> ) {
    assert && assert( random, 'random must be supplied' );

    const shuffled = random.shuffle( this );

    // Act on the targetArray so that removal and add notifications aren't sent.
    this.targetArray.length = 0;
    Array.prototype.push.apply( this.targetArray, shuffled );
  },

  // TODO https://github.com/phetsims/axon/issues/334 This also seems important to eliminate
  getArrayCopy: function() { return this.slice(); },

  dispose: function() {
    this.elementAddedEmitter.dispose();
    this.elementRemovedEmitter.dispose();
    this.lengthProperty.dispose();
    this._observableArrayPhetioObject && this._observableArrayPhetioObject.dispose();
  },

  /******************************************
   * PhET-iO
   *******************************************/
  toStateObject: function() {
    return { array: this.map( item => this.phetioElementType!.toStateObject( item ) ) };
  },
  applyState: function( stateObject: ObservableArrayState<any> ) {
    assert && assert( this.length === 0, 'ObservableArrays should be cleared at the beginning of state setting.' );
    this.length = 0;
    const elements = stateObject.array.map( paramStateObject => this.phetioElementType!.fromStateObject( paramStateObject ) );
    this.push( ...elements );
  },
  setNotificationsDeferred: function( notificationsDeferred: boolean ) {

    // Handle the case where a listener causes another element to be added/removed. That new action should notify last.
    if ( !notificationsDeferred ) {
      while ( this.deferredActions.length > 0 ) {
        this.deferredActions.shift()!();
      }
    }
    this.notificationsDeferred = notificationsDeferred;
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
  before.forEach( element => observableArray.emitNotification( observableArray.elementRemovedEmitter, element ) );
  after.forEach( element => observableArray.emitNotification( observableArray.elementAddedEmitter, element ) );
};

// Cache each parameterized ObservableArrayIO
// based on the parameter type, so that it is only created once.
const cache = new IOTypeCache<IOType<ObservableArrayPhetioObject<any>, ObservableArrayState<any>>>();

/**
 * ObservableArrayIO is the IOType for ObservableArrayDef. It delegates most of its implementation to ObservableArrayDef.
 * Instead of being a parametric type, it leverages the phetioElementType on ObservableArrayDef.
 */
const ObservableArrayIO = ( parameterType: AnyIOType ): IOType<ObservableArrayPhetioObject<any>, ObservableArrayState<any>> => {
  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType<ObservableArrayPhetioObject<any>, ObservableArrayState<any>>( `ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArrayPhetioObject,
      parameterTypes: [ parameterType ],
      toStateObject: observableArrayPhetioObject => {
        return observableArrayPhetioObject.observableArray.toStateObject();
      },
      applyState: ( observableArrayPhetioObject, state ) => {
        return observableArrayPhetioObject.observableArray.applyState( state );
      },
      stateSchema: {
        array: ArrayIO( parameterType )
      }
    } ) );
  }
  return cache.get( parameterType )!;
};

createObservableArray.ObservableArrayIO = ObservableArrayIO;

axon.register( 'createObservableArray', createObservableArray );
export default createObservableArray;
export { ObservableArrayIO };
export type { ObservableArray };