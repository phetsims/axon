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
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetio = require( 'ifphetio!PHET_IO/phetio' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );
  var TNumber = require( 'ifphetio!PHET_IO/types/TNumber' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );

  /**
   * Parametric wrapper type constructor.  Given an element type, this function returns an ObservbleArray wrapper type.
   * @param {TObject} elementType - wrapper type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function TObservableArray( elementType ) {

    /**
     * This type constructor is parameterized based on the instance of Events.
     * @param observableArray
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TObservableArrayImpl = function TObservableArrayImpl( observableArray, phetioID ) {
      assert && assert( typeof(elementType) === 'function', 'element type should be defined' );
      assertInstanceOf( observableArray, phet.axon.ObservableArray );

      TObject.call( this, observableArray, phetioID );
    };
    return phetioInherit( TObject, 'TObservableArray', TObservableArrayImpl, {

        /**
         * Adds a listener to the observable array.
         * @param listener
         * @public
         */
        addItemAddedListener: {
          returnType: TVoid,
          parameterTypes: [ TFunctionWrapper( TVoid, [ elementType ] ) ],
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
          returnType: TVoid,
          parameterTypes: [ TFunctionWrapper( TVoid, [ elementType ] ) ],
          implementation: function( listener ) {
            this.instance.addItemRemovedListener( listener );
          },
          documentation: 'Add a listener that is called when an item is removed from the observable array.'
        },

        /**
         * Get the number of electrons currently in the array.
         */
        getLength: {
          returnType: TNumber,
          parameterTypes: [],
          implementation: function() {
            return this.instance.length;
          },
          documentation: 'Get the number of elements in the observable array'
        }
      },

      {

        toStateObject: function( observableArray ) {
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

        setValue: function( instance, value ) {
          instance.clear();
          instance.addAll( value );
        },

        documentation: 'An array that sends notifications when its values have changed.',
        elementType: elementType,
        events: [ 'itemAdded', 'itemRemoved' ]
      } );
  }

  axon.register( 'TObservableArray', TObservableArray );

  return TObservableArray;
} );

