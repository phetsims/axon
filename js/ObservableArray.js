// Copyright 2002-2013, University of Colorado Boulder

/**
 * An observable array of items.
 * <p>
 * Because the array is observable, we must be careful about the possibility of concurrent-modification errors.
 * Any time we iterate over the array, we must iterate over a copy, because callback may be modifying the array.
 *
 * @author Sam Reid
 * @author Chris Malley
 */
define( function( require ) {
  'use strict';

  // modules
  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );

  axon.ObservableArray = function ObservableArray( array, options ) {

    this._options = _.extend( {
      allowDuplicates: false // are duplicate items allowed in the array?
    }, options );

    this._array = array || []; // internal, do not access directly
    this._addedListeners = []; // listeners called when an item is added
    this._removedListeners = []; // listeners called when an item is removed

    this.lengthProperty = new Property( this._array.length ); // observe this, but don't set it

    //Store the initial array, if any, for resetting, see #4
    this.initialArray = array ? array.slice() : [];
  };

  axon.ObservableArray.prototype = {

    //Restore the array back to its initial state
    //Note: if an item is in the current array and original array, it is removed and added back
    //This may or may not change in the future, see #4
    reset: function() {
      for ( var i = 0; i < this._array.length; i++ ) {
        this._fireItemRemoved( this._array[i] );
      }
      this._array = this.initialArray.slice();
      for ( i = 0; i < this._array.length; i++ ) {
        this._fireItemAdded( this._array[i] );
      }
    },

    get length() { return this._array.length; },

    /**
     * Adds a listener that will be notified when an item is added to the list.
     * @param listener function( item, observableArray )
     */
    addItemAddedListener: function( listener ) {
      assert && assert( this._addedListeners.indexOf( listener ) === -1 ); // listener is not already registered
      this._addedListeners.push( listener );
    },

    /**
     * Removes a listener that was added via addItemAddedListener.
     * @param listener
     */
    removeItemAddedListener: function( listener ) {
      var index = this._addedListeners.indexOf( listener );
      assert && assert( index !== -1 ); // listener is registered
      this._addedListeners.splice( index, 1 );
    },

    /**
     * Adds a listener that will be notified when an item is removed from the list.
     * @param listener function( item, observableArray )
     */
    addItemRemovedListener: function( listener ) {
      assert && assert( this._removedListeners.indexOf( listener ) === -1 ); // listener is not already registered
      this._removedListeners.push( listener );
    },

    /**
     * Removes a listener that was added via addItemRemovedListener.
     * @param listener
     */
    removeItemRemovedListener: function( listener ) {
      var index = this._removedListeners.indexOf( listener );
      assert && assert( index !== -1 ); // listener is registered
      this._removedListeners.splice( index, 1 );
    },

    /**
     * Convenience function for adding both types of listeners in one shot.
     * @param itemAddedListener
     * @param itemRemovedListener
     */
    addListeners: function( itemAddedListener, itemRemovedListener ) {
      this.addItemAddedListener( itemAddedListener );
      this.addItemRemovedListener( itemRemovedListener );
    },

    // Internal: called when an item is added.
    _fireItemAdded: function( item ) {
      var copy = this._addedListeners.slice( 0 ); // operate on a copy, firing could result in the listeners changing
      for ( var i = 0; i < copy.length; i++ ) {
        copy[i]( item, this );
      }
    },

    // Internal: called when an item is removed.
    _fireItemRemoved: function( item ) {
      var copy = this._removedListeners.slice( 0 ); // operate on a copy, firing could result in the listeners changing
      for ( var i = 0; i < copy.length; i++ ) {
        copy[i]( item, this );
      }
    },

    /**
     * Adds an item to the end of the array.
     * This is a convenience function, and is the same as push.
     * @param item
     */
    add: function( item ) {
      this.push( item );
    },

    /**
     * Add items to the end of the array.
     * This is a convenience function, and is the same as push.
     * @param {Array} items
     */
    addAll: function( items ) {
      this._array.push.apply( this._array, items );
    },

    /**
     * Removes the first occurrence of an item from the array.
     * If duplicates are allowed (see options.allowDuplicates) you may need to call this multiple
     * times to totally purge item from the array.
     * @param item
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
     * @param list {Array} a list of items to remove
     * @see ObservableArray.remove
     */
    removeAll: function( list ) {
      for ( var i = 0; i < list.length; i++ ) {
        var item = list[i];
        this.remove( item );
      }
    },

    /**
     * Pushes an item onto the end of the array.
     * @param item
     * @throws Error if duplicates are not allowed (see options.allowDuplicates) and item is already in the array
     */
    push: function( item ) {
      if ( !this._options.allowDuplicates && this.contains( item ) ) {
        throw new Error( 'duplicates are not allowed' );
      }
      this._array.push( item );
      this.lengthProperty.set( this._array.length );
      this._fireItemAdded( item );
    },

    /**
     * Removes an item from the end of the array and returns it.
     * @returns {*}
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
     */
    contains: function( item ) {
      return this.indexOf( item ) !== -1;
    },

    /**
     * Gets an item at the specified index.
     * @param index
     * @returns {*} the item, or undefined if there is no item at the specified index
     */
    get: function( index ) {
      return this._array[index];
    },

    /**
     * Gets the index of a specified item.
     * @param item
     * @returns {*} -1 if item is not in the array
     */
    indexOf: function( item ) {
      return this._array.indexOf( item );
    },

    /**
     * Removes all items from the array.
     */
    clear: function() {
      var copy = this._array.slice( 0 );
      for ( var i = 0; i < copy.length; i++ ) {
        this.remove( copy[i] );
      }
    },

    /**
     * Applies a callback function to each item in the array
     * @param callback function(item)
     */
    forEach: function( callback ) {
      this._array.slice().forEach( callback ); // do this on a copy of the array, in case callbacks involve array modification
    },

    /**
     * Maps the values in this ObservableArray using the specified function, and returns a new ObservableArray for chaining.
     * @param mapFunction
     * @returns {axon.ObservableArray}
     */
    map: function( mapFunction ) {
      return new axon.ObservableArray( this._array.map( mapFunction ) );
    },

    /**
     * Starting with the initial value, combine values from this ObservableArray to come up with a composite result.
     * Same as foldLeft.  In underscore this is called _.reduce aka _.foldl or _.inject
     * @param value
     * @param combiner
     * @returns {*}
     */
    reduce: function( value, combiner ) {
      for ( var i = 0; i < this._array.length; i++ ) {
        value = combiner( value, this._array[i] );
      }
      return value;
    },

    /**
     * Return the underlying array
     * @returns {*|Array}
     */
    getArray: function() {
      return this._array;
    }
  };

  return axon.ObservableArray;
} );