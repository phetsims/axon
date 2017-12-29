// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for phet's ObservableArray type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetio = require( 'ifphetio!PHET_IO/phetio' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var FunctionIO = require( 'ifphetio!PHET_IO/types/FunctionIO' );
  var NumberIO = require( 'ifphetio!PHET_IO/types/NumberIO' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var VoidIO = require( 'ifphetio!PHET_IO/types/VoidIO' );

  /**
   * Parametric wrapper type constructor.  Given an element type, this function returns an ObservbleArray wrapper type.
   * @param {ObjectIO} elementType - wrapper type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function ObservableArrayIO( elementType ) {

    /**
     * This type constructor is parameterized based on the instance of Events.
     * @param {ObservableArray} observableArray
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var ObservableArrayIOImpl = function ObservableArrayIOImpl( observableArray, phetioID ) {
      assert && assert( typeof(elementType) === 'function', 'element type should be defined' );
      assert && assertInstanceOf( observableArray, phet.axon.ObservableArray );

      ObjectIO.call( this, observableArray, phetioID );
    };
    return phetioInherit( ObjectIO, 'ObservableArrayIO', ObservableArrayIOImpl, {

        /**
         * Adds a listener to the observable array.
         * @param listener
         * @public
         */
        addItemAddedListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ elementType ] ) ],
          implementation: function( listener ) {
            this.instance.addItemAddedListener( listener );
          },
          documentation: 'Add a listener that is called when an item is added to the observable array.'
        },

        /**
         * Removes a listener that was added via addItemAddedListener.
         * @param listener
         * @public
         */
        addItemRemovedListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ elementType ] ) ],
          implementation: function( listener ) {
            this.instance.addItemRemovedListener( listener );
          },
          documentation: 'Add a listener that is called when an item is removed from the observable array.'
        },

        /**
         * Get the number of electrons currently in the array.
         */
        getLength: {
          returnType: NumberIO,
          parameterTypes: [],
          implementation: function() {
            return this.instance.length;
          },
          documentation: 'Get the number of elements in the observable array'
        }
      },

      {

        toStateObject: function( observableArray ) {
          assert && assertInstanceOf( observableArray, phet.axon.ObservableArray );
          if ( !observableArray ) {
            return observableArray;
          }
          return {
            array: observableArray.getArray().map( function( item ) { return item.phetioID; } )
          };
        },

        fromStateObject: function( stateObject ) {

          var tempArray = [];
          stateObject.array.forEach( function( elementTypePhetioID ) {
            tempArray.push( phetio.getWrapper( elementTypePhetioID ).instance );
          } );


          return tempArray;
        },

        setValue: function( observableArray, value ) {
          assert && assertInstanceOf( observableArray, phet.axon.ObservableArray );
          observableArray.clear();
          observableArray.addAll( value );
        },

        documentation: 'An array that sends notifications when its values have changed.',
        elementType: elementType,
        events: [ 'itemAdded', 'itemRemoved' ]
      } );
  }

  axon.register( 'ObservableArrayIO', ObservableArrayIO );

  return ObservableArrayIO;
} );

