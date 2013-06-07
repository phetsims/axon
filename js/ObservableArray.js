// Copyright 2002-2013, University of Colorado

/**
 * Subclass of Property that adds methods specific to boolean values
 *
 * @author Sam Reid
 */
define( function( require ) {
  "use strict";

  var Property = require( 'AXON/Property' );
  var inherit = require( 'PHET_CORE/inherit' );
  var axon = require( 'AXON/axon' );

  axon.ObservableArray = function ObservableArray( initialArray ) {
    this.array = initialArray || [];
    this.listeners = [];
  };
  axon.ObservableArray.prototype = {

    addListener: function( listener ) {
      this.listeners.push( listener );
    },
    /**
     * Notify that items have been added or removed from the list.
     * @param added
     * @param removed
     */
    trigger: function( added, removed ) {
      var observableArray = this;
      this.listeners.forEach( function( listener ) {
        listener( added, removed, observableArray );
      } );
    },
    add: function( item ) {
      this.array.push( item );
      this.trigger( [item], [] );
    },
    remove: function( item ) {
      var index = this.indexOf( item );
      if ( index !== -1 ) {
        this.array.splice( index, index + 1 );
        this.trigger( [], [item] );
      }
    },
    pop: function() {
      var item = this.array.pop();
      //TODO: fine grained event resolution
      this.trigger( [], [item] );//TODO: are we allocating too many arrays for notifications?
      return item;
    },
    contains: function( item ) { return this.indexOf( item ) !== -1; },
    at: function( index ) { return this.array[index]; },
    indexOf: function( item ) {return this.array.indexOf( item );},
    clear: function() {
      var copy = this.array.slice();
      this.array = [];
      this.trigger( [], copy );
    },
    get length() { return this.array.length; },
    forEach: function( callback ) { this.array.forEach( callback ); }
  };

  return axon.ObservableArray;
} );