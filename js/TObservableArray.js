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
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var axon = require( 'AXON/axon' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'ifphetio!PHET_IO/events/toEventOnEmit' );

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
       * @returns {Object} - returns the stateObject of child item
       */
      var formatForDataStream = function( item ) {

        // Supply phetioID if it is available
        var result = { phetioID: item.phetioID };

        // Supply state if it is available
        if ( elementType.toStateObject ) {
          result.state = elementType.toStateObject( item );
        }
        return result;
      };
      toEventOnEmit( observableArray.startedCallbacksForItemAddedEmitter, observableArray.endedCallbacksForItemAddedEmitter, 'model', phetioID, TObservableArray( elementType ), 'itemAdded', formatForDataStream );
      toEventOnEmit( observableArray.startedCallbacksForItemRemovedEmitter, observableArray.endedCallbacksForItemRemovedEmitter, 'model', phetioID, TObservableArray( elementType ), 'itemRemoved', formatForDataStream );
    };
    return phetioInherit( TObject, 'TObservableArray', TObservableArrayImpl, {}, {
      documentation: 'An array that sends notifications when its values have changed.',
      elementType: elementType,
      events: [ 'itemAdded', 'itemRemoved' ]
    } );
  }

  axon.register( 'TObservableArray', TObservableArray );

  return TObservableArray;
} );

