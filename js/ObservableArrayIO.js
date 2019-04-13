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
  var validate = require( 'AXON/validate' );

  // ifphetio
  var phetioEngine = require( 'ifphetio!PHET_IO/phetioEngine' );


  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservbleArray IO type.
   * @param {ObjectIO} elementType - IO type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @param {Object} options
   * @constructor
   */
  function ObservableArrayIO( elementType, options ) {

    options = _.extend( {
      isReferenceType: true
    }, options );

    /**
     * This type constructor is parameterized based on the elementType
     * @param {ObservableArray} observableArray
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var ObservableArrayIOImpl = function ObservableArrayIOImpl( observableArray, phetioID ) {
      assert && assert( typeof ( elementType ) === 'function', 'element type should be defined' );
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
          validate( observableArray, this.validator );
          if ( !observableArray ) {
            return observableArray;
          }
          return {
            array: observableArray.getArray().map( function( item ) {
              return options.isReferenceType ? item.phetioID : // TODO: assert that phetioID is defined
                     elementType.toStateObject( item );
            } )
          };
        },

        fromStateObject: function( stateObject ) {
          var tempArray = [];
          stateObject.array.forEach( function( elementTypePhetioID ) {
            tempArray.push( phetioEngine.getPhetioObject( elementTypePhetioID ) );
          } );
          return tempArray;
        },

        setValue: function( observableArray, fromStateObject ) {
          validate( observableArray, this.validator );
          observableArray.clear();
          observableArray.addAll( fromStateObject );
        },

        documentation: 'An array that sends notifications when its values have changed.',
        elementType: elementType,
        validator: {
          isValidValue: v => {
            var ObservableArray = window.phet ? phet.axon.ObservableArray : axon.ObservableArray;
            return v instanceof ObservableArray;
          }
        },
        events: [ 'itemAdded', 'itemRemoved' ]
      } );
  }

  axon.register( 'ObservableArrayIO', ObservableArrayIO );

  return ObservableArrayIO;
} );

