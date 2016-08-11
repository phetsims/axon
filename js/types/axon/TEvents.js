// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TFunctionWrapper = require( 'PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var TString = require( 'PHET_IO/types/TString' );
  var TVoid = require( 'PHET_IO/types/TVoid' );
  var phetioEvents = require( 'PHET_IO/phetioEvents' );

  // The supported events have this structure:
  // object: {event1:[{argName:argName,argType:argType},{}},...}
  // Here is code that tests it out:
  //  var events = new TEvents();
  //phet-io && phetio.addInstance( 'concentrationScreen.testEvents', events );
  //
  //events.trigger( 'personBorn', 'larry', 123 );
  //events.trigger( 'purchasedSolute', Solute.DRINK_MIX );

  // With this for the API file
  //'concentrationScreen.testEvents': TEvents( {
  //    personBorn: [ { arg: 'name', phetioValueType: TString }, { arg: 'length', phetioValueType: TNumber } ],
  //    purchasedSolute: [ { arg: 'solute', type: Solute } ],
  //    personAteLunch: []
  //  } )
  var TEvents = function( events ) {
    return phetioInherit( TObject, 'TEvents', function TEventsImpl( instance, phetioID ) {
      assertInstanceOf( instance, phet.axon.Events );
      TObject.call( this, instance, phetioID );

      // Add listeners for each event name
      for ( var eventName in events ) {
        if ( events.hasOwnProperty( eventName ) ) {
          (function( eventName ) {

            // Listen for each event
            instance.onStatic( eventName, function() {
              var args = Array.prototype.slice.call( arguments );
              var argNameType = events[ eventName ];
              var optionsForArch = {};
              for ( var i = 0; i < args.length; i++ ) {
                var arg = args[ i ];
                var argName = argNameType[ i ].arg;
                var argType = argNameType[ i ].type;

                var argValue = arg;
                if ( argType.toStateObject ) {
                  argValue = argType.toStateObject( argValue );
                }

                optionsForArch[ argName ] = argValue;
              }
              var messageIndex = phetioEvents.start( 'model', phetioID, TEvents, eventName, optionsForArch );
              phetioEvents.end( messageIndex );
            } );
          })( eventName );
        }
      }
    }, {

      addListener: {
        returnType: TVoid,
        parameterTypes: [ TString, TFunctionWrapper( TVoid, [ TObject ] ) ],
        implementation: function( eventName, callback ) {
          this.instance.onStatic( eventName, callback );
        },
        documentation: 'Adds a listener to the specified event channel'
      },

      removeListener: {
        returnType: TVoid,
        parameterTypes: [ TString, TFunctionWrapper( TVoid, [ TObject ] ) ],
        implementation: function( eventName, callback ) {
          this.instance.offStatic( eventName, callback );
        },
        documentation: 'Removes a listener that was added with addListener'
      }
    }, {
      events: _.keys( events ),
      documentation: 'Event system, with multiple channels defined by string keys'
    } );
  };

  phetioNamespace.register( 'TEvents', TEvents );

  return TEvents;
} );

