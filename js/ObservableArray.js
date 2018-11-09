// Copyright 2013-2016, University of Colorado Boulder

/**
 * An observable array of items.
 *
 * Because the array is observable, we must be careful about the possibility of concurrent-modification errors.
 * Any time we iterate over the array, we must iterate over a copy, because callback may be modifying the array.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var NumberProperty = require( 'AXON/NumberProperty' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var ObservableArrayIO = require( 'AXON/ObservableArrayIO' );
  var PhetioObject = require( 'TANDEM/PhetioObject' );
  var Tandem = require( 'TANDEM/Tandem' );

  // Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
  var ObservableArrayIOType = ObservableArrayIO( ObjectIO );

  /**
   * @param {Object[]} [array]
   * @param {Object} [options]
   * @constructor
   */
  function ObservableArray( array, options ) {

    // Special case that the user supplied options but no array
    if ( array instanceof Object && !( Array.isArray( array ) ) ) {
      options = array;
      array = null;
    }

    options = _.extend( {
      allowDuplicates: false, // are duplicate items allowed in the array?
      phetioType: ObservableArrayIOType,
      tandem: Tandem.optional
    }, options );

    this.allowDuplicates = options.allowDuplicates; // @private

    this._array = array || []; // @private internal, do not access directly
    this._addedListeners = []; // @private listeners called when an item is added
    this._removedListeners = []; // @private listeners called when an item is removed

    // @public (read-only) observe this, but don't set it
    this.lengthProperty = new NumberProperty( this._array.length, {
      numberType: 'Integer',
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      phetioReadOnly: true
    } );

    // @private Store the initial array, if any, for resetting, see #4
    this.initialArray = array ? array.slice() : [];

    PhetioObject.call( this, options );
  }

  axon.register( 'ObservableArray', ObservableArray );

  return inherit( PhetioObject, ObservableArray, {

    // @public
    dispose: function() {
      this.lengthProperty.dispose();
      PhetioObject.prototype.dispose.call( this );
    },

    /**
     * Restore the array back to its initial state
     * Note: if an item is in the current array and original array, it is removed and added back
     * This may or may not change in the future, see #4
     * @public
     */
    reset: function() {
      for ( var i = 0; i < this._array.length; i++ ) {
        this._fireItemRemoved( this._array[ i ] );
      }
      this._array = this.initialArray.slice();
      for ( i = 0; i < this._array.length; i++ ) {
        this._fireItemAdded( this._array[ i ] );
      }
    },

    // @public
    get length() { return this._array.length; },

    /**
     * Adds a listener that will be notified when an item is added to the list.
     * @param listener function( item, observableArray )
     * @public
     */
    addItemAddedListener: function( listener ) {
      assert && assert( this._addedListeners.indexOf( listener ) === -1 ); // listener is not already registered
      this._addedListeners.push( listener );
    },

    /**
     * Removes a listener that was added via addItemAddedListener.
     * @param listener
     * @public
     */
    removeItemAddedListener: function( listener ) {
      var index = this._addedListeners.indexOf( listener );
      assert && assert( index !== -1 ); // listener is registered
      this._addedListeners.splice( index, 1 );
    },

    /**
     * Adds a listener that will be notified when an item is removed from the list.
     * @param listener function( item, observableArray )
     * @public
     */
    addItemRemovedListener: function( listener ) {
      assert && assert( this._removedListeners.indexOf( listener ) === -1, 'Listener was already registered' ); // listener is not already registered
      this._removedListeners.push( listener );
    },

    /**
     * Removes a listener that was added via addItemRemovedListener.
     * @param listener
     * @public
     */
    removeItemRemovedListener: function( listener ) {
      var index = this._removedListeners.indexOf( listener );
      assert && assert( index !== -1, 'Listener is still registered after removal' ); // listener is registered
      this._removedListeners.splice( index, 1 );
    },

    // @private called when an item is added.
    _fireItemAdded: function( item ) {
      var self = this;
      this.phetioStartEvent( 'itemAdded', function() {
        return self.phetioType.elementType.toStateObject( item );
      } );

      //Signify that an item was added to the list
      var copy = this._addedListeners.slice( 0 ); // operate on a copy, firing could result in the listeners changing
      for ( var i = 0; i < copy.length; i++ ) {
        copy[ i ]( item, this );
      }

      this.phetioEndEvent();
    },

    // @private called when an item is removed.
    _fireItemRemoved: function( item ) {
      var self = this;
      this.phetioStartEvent( 'itemRemoved', function() {
        return self.phetioType.elementType.toStateObject( item );
      } );

      //Signify that an item was removed from the list
      var copy = this._removedListeners.slice( 0 ); // operate on a copy, firing could result in the listeners changing
      for ( var i = 0; i < copy.length; i++ ) {
        copy[ i ]( item, this );
      }

      this.phetioEndEvent();
    },

    /**
     * Adds an item to the end of the array.
     * This is a convenience function, and is the same as push.
     * @param item
     * @public
     */
    add: function( item ) {
      this.push( item );
    },

    /**
     * Add items to the end of the array.
     * This is a convenience function, and is the same as push.
     * @param {Array} items
     * @public
     */
    addAll: function( items ) {
      for ( var i = 0; i < items.length; i++ ) {
        this.add( items[ i ] );
      }
    },

    /**
     * Removes the first occurrence of an item from the array.
     * If duplicates are allowed (see options.allowDuplicates) you may need to call this multiple
     * times to totally purge item from the array.
     * @param item
     * @public
     */
    remove: function( item ) {
      var index = this._array.indexOf( item );
      if ( index !== -1 ) {
        this._array.splice( index, 1 );
        this.lengthProperty.set( this._array.length );
        this._fireItemRemoved( item );
      }
    },

    /**
     * Removes the first occurrence of each item in the specified array.
     * @param {Array} array a list of items to remove
     * @see ObservableArray.remove
     * @public
     */
    removeAll: function( array ) {
      assert && assert( _.isArray( array ), 'array should be an array' );
      for ( var i = 0; i < array.length; i++ ) {
        this.remove( array[ i ] );
      }
    },

    /**
     * Pushes an item onto the end of the array.
     * @param item
     * @throws Error if duplicates are not allowed (see options.allowDuplicates) and item is already in the array
     * @public
     */
    push: function( item ) {
      if ( !this.allowDuplicates && this.contains( item ) ) {
        throw new Error( 'duplicates are not allowed' );
      }
      this._array.push( item );
      this.lengthProperty.set( this._array.length );
      this._fireItemAdded( item );
    },

    /**
     * Removes an item from the end of the array and returns it.
     * @returns {*}
     * @public
     */
    pop: function() {
      var item = this._array.pop();
      if ( item !== undefined ) {
        this.lengthProperty.set( this._array.length );
        this._fireItemRemoved( item );
      }
      return item;
    },

    /**
     * Removes an item from the beginning of the array and returns it.
     * @returns {*}
     * @public
     */
    shift: function() {
      var item = this._array.shift();
      if ( item !== undefined ) {
        this.lengthProperty.set( this._array.length );
        this._fireItemRemoved( item );
      }
      return item;
    },

    /**
     * Does the array contain the specified item?
     * @param item
     * @returns {boolean}
     * @public
     */
    contains: function( item ) {
      return this.indexOf( item ) !== -1;
    },

    /**
     * Gets an item at the specified index.
     * @param index
     * @returns {*} the item, or undefined if there is no item at the specified index
     * @public
     */
    get: function( index ) {
      return this._array[ index ];
    },

    /**
     * Gets the index of a specified item.
     * @param item
     * @returns {*} -1 if item is not in the array
     * @public
     */
    indexOf: function( item ) {
      return this._array.indexOf( item );
    },

    /**
     * Removes all items from the array.
     * @public
     */
    clear: function() {
      while ( this.length > 0 ) {
        this.pop();
      }
    },

    /**
     * Applies a callback function to each item in the array
     * @param callback function(item)
     * @public
     */
    forEach: function( callback ) {
      this._array.slice().forEach( callback ); // do this on a copy of the array, in case callbacks involve array modification
    },

    /**
     * Maps the values in this ObservableArray using the specified function, and returns a new ObservableArray for chaining.
     * @param mapFunction
     * @returns {ObservableArray}
     * @public
     */
    map: function( mapFunction ) {
      return new ObservableArray( this._array.map( mapFunction ) );
    },

    /**
     * Filters the values in this ObservableArray using the predicate function, and returns a new ObservableArray for chaining.
     * @param predicate
     * @returns {ObservableArray}
     * @public
     */
    filter: function( predicate ) {
      return new ObservableArray( this._array.filter( predicate ) );
    },

    /**
     * Count the number of items in this ObservableArray that satisfy the given Predicate.
     * @param {function} predicate
     * @returns {number}
     * @public
     */
    count: function( predicate ) {
      var count = 0;
      for ( var i = 0; i < this._array.length; i++ ) {
        if ( predicate( this._array[ i ] ) ) {
          count++;
        }
      }
      return count;
    },

    /**
     * Find the first element that matches the given predicate.
     * @param {function} predicate
     * @param {number} [fromIndex] - optional start index for the search
     */
    find: function( predicate, fromIndex ) {
      return _.find( this._array, predicate, fromIndex );
    },

    /**
     * Returns true if some element in this ObservableArray matches the predicate.
     * @param {function} predicate - the function to test elements
     * @returns {boolean}
     */
    some: function( predicate ) {
      return _.some( this._array, predicate );
    },

    /**
     * Starting with the initial value, combine values from this ObservableArray to come up with a composite result.
     * Same as foldLeft.  In underscore this is called _.reduce aka _.fold or _.inject
     * @param value
     * @param combiner
     * @returns {*}
     * @public
     */
    reduce: function( value, combiner ) {
      for ( var i = 0; i < this._array.length; i++ ) {
        value = combiner( value, this._array[ i ] );
      }
      return value;
    },

    /**
     * Return the underlying array
     * @returns {Array}
     * @public
     */
    getArray: function() {
      return this._array;
    },

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
    splice: function( start, deleteCount, item1, item2, etc ) {
      var deleted = this._array.splice.apply( this._array, arguments );
      var args = Array.prototype.slice.call( arguments );
      for ( var i = 0; i < deleted.length; i++ ) {
        this._fireItemRemoved( deleted[ i ] );
      }

      for ( var k = 2; k < args.length; k++ ) {
        this._fireItemAdded( args[ k ] );
      }
      return deleted;
    },

    /**
     * Changes the ordering of elements in the array.  Requires a Random source so that shuffles can be reproducible.
     * No items are added or removed, and this method does not send out any notifications.
     * @param {Random} random - from dot
     */
    shuffle: function( random ) {
      assert && assert( random, 'random must be supplied' );

      // preserve the same _array reference in case any clients got a reference to it with getArray()
      var shuffled = random.shuffle( this._array );
      this._array.length = 0;
      Array.prototype.push.apply( this._array, shuffled );
    }
  } );
} );