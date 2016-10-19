// Copyright 2016, University of Colorado Boulder

/**
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

  function TObservableArray( elementType ) {
    assert && assert( typeof( elementType ) === 'function', 'element type should be defined' );

    var TObservableArrayImpl = function TObservableArrayImpl( observableArray, phetioID ) {
      TObject.call( this, observableArray, phetioID );
      assertInstanceOf( observableArray, phet.axon.ObservableArray );

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

