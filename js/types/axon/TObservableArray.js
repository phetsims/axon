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
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'PHET_IO/events/toEventOnEmit' );

  /**
   * Parametric wrapper type constructor.  Given an element type, this function returns an ObservbleArray wrapper type.
   * @param {TObject} elementType - wrapper type of the DerivedProperty
   * @constructor
   */
  function TObservableArray( elementType ) {
    assert && assert( typeof( elementType ) === 'function', 'element type should be defined' );

    /**
     * This type constructor is parameterized based on the instance of Events.
     * @param observableArray
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TObservableArrayImpl = function TObservableArrayImpl( observableArray, phetioID ) {
      TObject.call( this, observableArray, phetioID );
      assertInstanceOf( observableArray, phet.axon.ObservableArray );

      /**
       * @param item
       * @returns {{item: Object}} - returns the stateObject of child item
       */
      var itemToStateObject = function( item ) {

        assert && assert( !!elementType.toStateObject, elementType.typeName + '.toStateObject is undefined' );

        return { item: elementType.toStateObject( item ) };
      };
      toEventOnEmit( observableArray, 'CallbacksForItemAddedEmitter', 'model', phetioID, TObservableArray( elementType ), 'itemAdded', itemToStateObject );
      toEventOnEmit( observableArray, 'CallbacksForItemRemovedEmitter', 'model', phetioID, TObservableArray( elementType ), 'itemRemoved', itemToStateObject );
    };
    return phetioInherit( TObject, 'TObservableArray', TObservableArrayImpl, {}, {
      documentation: 'An array that sends notifications when its values have changed.',
      elementType: elementType,
      events: [ 'itemAdded', 'itemRemoved' ]
    } );
  }

  phetioNamespace.register( 'TObservableArray', TObservableArray );

  return TObservableArray;
} );

