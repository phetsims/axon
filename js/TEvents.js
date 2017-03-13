// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for phet's Events type.
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
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var TString = require( 'ifphetio!PHET_IO/types/TString' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );

  /**
   * Parametric wrapper type constructor.  Given an events type, this function returns an appropriate events wrapper type.
   *
   * This is a good test to use:
   *     var events = new TEvents();
   *     phet-io && phetio.addInstance( 'concentrationScreen.testEvents', events );
   *     events.trigger( 'personBorn', 'larry', 123 );
   *     events.trigger( 'purchasedSolute', Solute.DRINK_MIX );
   *
   *     With this for the API file
   *     'concentrationScreen.testEvents': TEvents( {
   *      personBorn: [ { arg: 'name', phetioValueType: TString }, { arg: 'length', phetioValueType: TNumber } ],
   *      purchasedSolute: [ { arg: 'solute', type: Solute } ],
   *      personAteLunch: [] } )
   *
   * @param events {Object} - wrapper type of Events: {event1:[{argName:argName,argType:argType},{}},...}
   * @constructor
   */
  function TEvents( events ) {

    /**
     * This type constructor is parameterized based on the instance of Events.
     * @param instance {Object} - Events
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TEventsImpl = function TEventsImpl( instance, phetioID ) {
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
    };
    return phetioInherit( TObject, 'TEvents', TEventsImpl, {

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
  }

  axon.register( 'TEvents', TEvents );

  return TEvents;
} );

