// Copyright 2013-2020, University of Colorado Boulder

/**
 * An observable array of items which sends notifications when items are added or removed.
 *
 * Because the array is observable, we must be careful about the possibility of concurrent-modification errors.
 * Any time we iterate over the array, we must iterate over a copy, because callback may be modifying the array.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';

class ObservableArray extends PhetioObject {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    assert && assert( !Array.isArray( options ), 'ObservableArray cannot be initialized with values' );

    options = merge( {
      allowDuplicates: false, // are duplicate items allowed in the array?
      phetioType: DefaultObservableArrayIOType,
      tandem: Tandem.OPTIONAL
    }, options );

    assert && assert( options.phetioType && options.phetioType.parameterTypes, 'ObservableArray\'s phetioType should have a parameterType' );
    assert && assert( options.phetioType && options.phetioType.parameterTypes.length === 1, 'ObservableArray\'s phetioType should have a parameterType' );
    assert && assert( options.phetioType && options.phetioType.parameterTypes[ 0 ], 'ObservableArray\'s phetioType should have a parameterType' );

    super( options );

    this.allowDuplicates = options.allowDuplicates; // @private

    this._options = options; // @private, for creating internal ObservableArray copies, see map/filter

    this._array = []; // @private internal, do not access directly

    // @private
    this.itemAddedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue }, { valueType: ObservableArray } ] } );
    this.itemRemovedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue }, { valueType: ObservableArray } ] } );

    // @public (read-only) observe this, but don't set it
    this.lengthProperty = new NumberProperty( this._array.length, {
      numberType: 'Integer',
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      phetioReadOnly: true
    } );
  }

  /**
   * @public
   */
  dispose() {
    this.lengthProperty.dispose();
    PhetioObject.prototype.dispose.call( this );
  }

  /**
   * Resetting an ObservableArray is the same as clearing it.  This method is so that model reset functions will
   * primarily call `reset` on Property and ObservableArray instances.
   * @public
   */
  reset() {
    this.clear();
  }

  // @public
  get length() { return this._array.length; }

  /**
   * Adds a listener that will be notified when an item is added to the list.
   * @param {function(item:*, ObservableArray)} listener
   * @public
   */
  addItemAddedListener( listener ) {
    assert && assert( !this.itemAddedEmitter.hasListener( listener ), 'listener is already registered' );
    this.itemAddedEmitter.addListener( listener );
  }

  /**
   * Removes a listener that was added via addItemAddedListener.
   * @param {function(item:*, ObservableArray)} listener
   * @public
   */
  removeItemAddedListener( listener ) {
    assert && assert( this.itemAddedEmitter.hasListener( listener ), 'listener is not registered' );
    this.itemAddedEmitter.removeListener( listener );
  }

  /**
   * Adds a listener that will be notified when an item is removed from the list.
   * @param listener function( item, observableArray )
   * @public
   */
  addItemRemovedListener( listener ) {
    assert && assert( !this.itemRemovedEmitter.hasListener( listener ), 'listener is already registered' );
    this.itemRemovedEmitter.addListener( listener );
  }

  /**
   * Removes a listener that was added via addItemRemovedListener.
   * @param listener
   * @public
   */
  removeItemRemovedListener( listener ) {
    assert && assert( this.itemRemovedEmitter.hasListener( listener ), 'listener is not registered' );
    this.itemRemovedEmitter.removeListener( listener );
  }

  /**
   * called when an item is added
   * @param {*} item
   * @private
   */
  _fireItemAdded( item ) {
    this.phetioStartEvent( 'itemAdded', {
      getData: () => {
        return this.phetioType.parameterTypes[ 0 ].toStateObject( item );
      }
    } );

    this.itemAddedEmitter.emit( item, this );

    this.phetioEndEvent();
  }

  /**
   * called when an item is added
   * @param {*} item
   * @private
   */
  _fireItemRemoved( item ) {
    this.phetioStartEvent( 'itemRemoved', {
      getData: () => {
        return this.phetioType.parameterTypes[ 0 ].toStateObject( item );
      }
    } );

    this.itemRemovedEmitter.emit( item, this );

    this.phetioEndEvent();
  }

  /**
   * Adds an item to the end of the array.
   * This is a convenience function, and is the same as push.
   * @param item
   * @public
   */
  add( item ) {
    this.push( item );
  }

  /**
   * Add items to the end of the array.
   * This is a convenience function, and is the same as push.
   * @param {Array} items
   * @public
   */
  addAll( items ) {
    for ( let i = 0; i < items.length; i++ ) {
      this.add( items[ i ] );
    }
  }

  /**
   * Removes the first occurrence of an item from the array.
   * If duplicates are allowed (see options.allowDuplicates) you may need to call this multiple
   * times to totally purge item from the array.
   * @param item
   * @public
   */
  remove( item ) {
    const index = this._array.indexOf( item );
    if ( index !== -1 ) {
      this._array.splice( index, 1 );
      this.lengthProperty.set( this._array.length );
      this._fireItemRemoved( item );
    }
  }

  /**
   * Removes the first occurrence of each item in the specified array.
   * @param {Array} array a list of items to remove
   * @see ObservableArray.remove
   * @public
   */
  removeAll( array ) {
    assert && assert( _.isArray( array ), 'array should be an array' );
    for ( let i = 0; i < array.length; i++ ) {
      this.remove( array[ i ] );
    }
  }

  /**
   * Pushes an item onto the end of the array.
   * @param item
   * @throws Error if duplicates are not allowed (see options.allowDuplicates) and item is already in the array
   * @public
   */
  push( item ) {
    if ( !this.allowDuplicates && this.includes( item ) ) {
      throw new Error( 'duplicates are not allowed' );
    }
    this._array.push( item );
    this.lengthProperty.set( this._array.length );
    this._fireItemAdded( item );
  }

  /**
   * Removes an item from the end of the array and returns it.
   * @returns {*}
   * @public
   */
  pop() {
    assert && assert( this.length > 0, 'cannot pop an empty ObservableArray' );

    const item = this._array.pop();
    if ( item !== undefined ) {
      this.lengthProperty.set( this._array.length );
      this._fireItemRemoved( item );
    }
    return item;
  }

  /**
   * Removes an item from the beginning of the array and returns it.
   * @returns {*}
   * @public
   */
  shift() {
    assert && assert( this.length > 0, 'cannot shift an empty ObservableArray' );

    const item = this._array.shift();
    if ( item !== undefined ) {
      this.lengthProperty.set( this._array.length );
      this._fireItemRemoved( item );
    }
    return item;
  }

  /**
   * Does the array include the specified item?
   * @param {*} item
   * @returns {boolean}
   * @public
   */
  includes( item ) {
    return this._array.includes( item );
  }

  /**
   * Gets an item at the specified index.
   * @param index
   * @returns {*} the item
   * @throws assertion Error if the index is out of bounds
   * @public
   */
  get( index ) {
    assert && assert( index >= 0 && index < this.length, `index out of bounds: ${index}` );
    return this._array[ index ];
  }

  /**
   * Gets the index of a specified item.
   * @param item
   * @returns {*} -1 if item is not in the array
   * @public
   */
  indexOf( item ) {
    return this._array.indexOf( item );
  }

  /**
   * Removes all items from the array.
   * @public
   */
  clear() {
    while ( this.length > 0 ) {
      this.pop();
    }
  }

  /**
   * Applies a callback function to each item in the array
   * @param {function(item:*)} callback
   * @public
   */
  forEach( callback ) {

    // TODO: don't slice on forEach, see https://github.com/phetsims/axon/issues/283
    this._array.slice().forEach( callback ); // do this on a copy of the array, in case callbacks involve array modification
  }

  /**
   * Maps the values in this ObservableArray using the specified function, and returns a new array for chaining.
   * @param {function(element:*):*} mapFunction - from Observable array element to something else
   * @returns {Object[]}
   * @public
   */
  map( mapFunction ) {
    return this._array.map( mapFunction );
  }

  /**
   * Filters the values in this ObservableArray using the predicate function, and returns a new array for chaining.
   * @param {function(element):boolean} predicate
   * @returns {Object[]}
   * @public
   */
  filter( predicate ) {
    return this._array.filter( predicate );
  }

  /**
   * Count the number of items in this ObservableArray that satisfy the given Predicate.
   * @param {function(item:*):boolean} predicate
   * @returns {number}
   * @public
   */
  count( predicate ) {
    let count = 0;
    for ( let i = 0; i < this._array.length; i++ ) {
      if ( predicate( this._array[ i ] ) ) {
        count++;
      }
    }
    return count;
  }

  /**
   * Find the first element that matches the given predicate.
   * @param {function(item:*):boolean} predicate
   * @param {number} [fromIndex] - optional start index for the search
   * @returns {*} the first element that matches the given predicate, or undefined if no matching item can be found
   * @throws assertion Error if the fromIndex is specified and out of range
   * @public
   */
  find( predicate, fromIndex ) {
    assert && ( fromIndex !== undefined ) && assert( typeof fromIndex === 'number', 'fromIndex must be numeric, if provided' );
    assert && ( typeof fromIndex === 'number' ) && assert( fromIndex >= 0 && fromIndex < this.length,
      `fromIndex out of bounds: ${fromIndex}` );
    return _.find( this._array, predicate, fromIndex );
  }

  /**
   * Returns true if some element in this ObservableArray matches the predicate.
   * @param {function(item:*):boolean} predicate
   * @returns {boolean}
   * @public
   */
  some( predicate ) {
    return _.some( this._array, predicate );
  }

  /**
   * Returns true if every element in this ObservableArray matches the predicate.
   * @param {function(item:*):boolean} predicate
   * @returns {boolean}
   * @public
   */
  every( predicate ) {
    return this._array.every( predicate );
  }

  /**
   * Starting with the initial value, combine values from this ObservableArray to come up with a composite result.
   * Same as foldLeft.  In underscore this is called _.reduce aka _.fold or _.inject
   * @param {function(value:*, item:*)} combiner
   * @param {*} value - output of the reduction
   * @returns {*}
   * @public
   */
  reduce( combiner, value ) {
    for ( let i = 0; i < this._array.length; i++ ) {
      value = combiner( value, this._array[ i ] );
    }
    return value;
  }

  /**
   * Return the underlying array.  Most clients should be able to use the ObservableArray functions for array access
   * or filtering, mapping, etc. instead of this function.  If it is necessary to access the array directly (say, for
   * performance reasons), please document why it is necessary. Also note this is not a defensive copy, so the client
   * will need to take care not to disturb the elements of the array.
   * @returns {Array}
   * @public
   */
  getArray() {
    return this._array;
  }

  /**
   * Like getArray, but returns a copy of the array. Use this if you will be modifying the collection.
   * @returns {Array}
   * @public
   */
  getArrayCopy() {
    return this._array.slice();
  }

  /**
   * Add/remove elements from any point in the array
   * @param {number} start - the index to start adding/removing items
   * @param {number} deleteCount - the number of items to delete
   * @param {Object} [item1] - an item to add
   * @param {Object} [item2] - an item to add
   * @param {Object} [etc] - varargs items to add etc.
   * @returns {Object[]} the items that were deleted.
   * @public
   */
  splice( start, deleteCount, item1, item2, etc ) {
    const deleted = this._array.splice.apply( this._array, arguments );
    const args = Array.prototype.slice.call( arguments );
    for ( let i = 0; i < deleted.length; i++ ) {
      this._fireItemRemoved( deleted[ i ] );
    }

    for ( let k = 2; k < args.length; k++ ) {
      this._fireItemAdded( args[ k ] );
    }
    this.lengthProperty.set( this._array.length );
    return deleted;
  }

  /**
   * Changes the ordering of elements in the array.  Requires a Random source so that shuffles can be reproducible.
   * No items are added or removed, and this method does not send out any notifications.
   * @param {Random} random - from dot
   * @public
   */
  shuffle( random ) {
    assert && assert( random, 'random must be supplied' );

    // preserve the same _array reference in case any clients got a reference to it with getArray()
    const shuffled = random.shuffle( this._array );
    this._array.length = 0;
    Array.prototype.push.apply( this._array, shuffled );
  }
}

// {Object.<parameterTypeName:string, IOType>} - Cache each parameterized ObservableArray.ObservableArrayIO so that it
// is only created once.
const cache = {};

/**
 * An observable array that triggers notifications when items are added or removed.
 * @param {IOType} parameterType
 * @returns {IOType}
 */
ObservableArray.ObservableArrayIO = parameterType => {
  assert && assert( parameterType instanceof IOType, 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = new IOType( `ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArray,
      documentation: 'An array that sends notifications when its values have changed.',
      events: [ 'itemAdded', 'itemRemoved' ],
      parameterTypes: [ parameterType ],
      toStateObject: observableArray => ( { array: observableArray.getArray().map( item => parameterType.toStateObject( item ) ) } ),
      applyState: ( observableArray, stateObject ) => {
        observableArray.clear();
        const elements = stateObject.array.map( paramStateObject => parameterType.fromStateObject( paramStateObject ) );
        observableArray.addAll( elements );
      },
      methods: {
        addItemAddedListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
          implementation: function( listener ) {
            this.addItemAddedListener( listener );
          },
          documentation: 'Add a listener that is called when an item is added to the observable array.'
        },
        addItemRemovedListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
          implementation: function( listener ) {
            this.addItemRemovedListener( listener );
          },
          documentation: 'Add a listener that is called when an item is removed from the observable array.'
        },
        getLength: {
          returnType: NumberIO,
          parameterTypes: [],
          implementation: function() {
            return this.length;
          },
          documentation: 'Get the number of elements in the observable array'
        }
      }
    } );
  }

  return cache[ parameterType.typeName ];
};

// Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
const DefaultObservableArrayIOType = ObservableArray.ObservableArrayIO( IOType.ObjectIO );

axon.register( 'ObservableArray', ObservableArray );
export default ObservableArray;
