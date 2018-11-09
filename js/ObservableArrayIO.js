// Copyright 2016, University of Colorado Boulder

/**
 * IO type for ObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var FunctionIO = require( 'TANDEM/types/FunctionIO' );
  var NumberIO = require( 'TANDEM/types/NumberIO' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // ifphetio
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioEngine = require( 'ifphetio!PHET_IO/phetioEngine' );

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservbleArray IO type.
   * @param {ObjectIO} elementType - IO type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function ObservableArrayIO( elementType ) {

    /**
     * This type constructor is parameterized based on the elementType
     * @param {ObservableArray} observableArray
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var ObservableArrayIOImpl = function ObservableArrayIOImpl( observableArray, phetioID ) {
      assert && assert( typeof( elementType ) === 'function', 'element type should be defined' );
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
            tempArray.push( phetioEngine.getInstance( elementTypePhetioID ) );
          } );
          return tempArray;
        },

        setValue: function( observableArray, fromStateObject ) {
          assert && assertInstanceOf( observableArray, phet.axon.ObservableArray );
          observableArray.clear();
          observableArray.addAll( fromStateObject );
        },

        documentation: 'An array that sends notifications when its values have changed.',
        elementType: elementType,
        events: [ 'itemAdded', 'itemRemoved' ]
      } );
  }

  axon.register( 'ObservableArrayIO', ObservableArrayIO );

  return ObservableArrayIO;
} );

