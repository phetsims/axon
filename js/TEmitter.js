// Copyright 2016, University of Colorado Boulder

/**
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
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );

  /**
   * Wrapper type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   * @param {function[]} phetioArgumentTypes - If loaded by phet (not phet-io), the array will be of functions
   *                                          returned by the 'ifphetio!' plugin.
   * @returns {TEmitterImpl}
   * @constructor
   */
  function TEmitter( phetioArgumentTypes ) {

    var TEmitterImpl = function TEmitterImpl( emitter, phetioID ) {
      assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );

      TObject.call( this, emitter, phetioID );
      assertInstanceOf( emitter, phet.axon.Emitter );

      // Allow certain Emitters to suppress their data output, such as the frameCompletedEmitter
      if ( emitter.phetioEmitData ) {
        emitter.callbacksStartedEmitter.addListener( function() {
          assert && assert( arguments.length === phetioArgumentTypes.length, 'Wrong number of arguments, expected ' + phetioArgumentTypes.length + ', received ' + arguments.length );
          var parameters = { arguments: Array.prototype.slice.call( arguments ) };
          var messageIndex = phetioEvents.start( 'model', phetioID, TEmitter( phetioArgumentTypes ), 'emitted', parameters );

          emitter.callbacksEndedEmitter.addListener( function listener() {
            assert && assert( arguments.length === 0, 'Wrong number of arguments, expected ' + phetioArgumentTypes.length + ', received ' + arguments.length );
            emitter.callbacksEndedEmitter.removeListener( listener );
            phetioEvents.end( messageIndex );
          } );
        } );
      }
    };

    return phetioInherit( TObject, 'TEmitter', TEmitterImpl, {
      addListener: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, phetioArgumentTypes ) ],
        implementation: function( listener ) {
          this.instance.addListener( listener );
        },
        documentation: 'Add a listener which will be called when the emitter emits.'
      }
    }, {
      documentation: 'Emitters indicate when events have occurred, with optional arguments describing the event',
      events: [ 'emitted' ]
    } );
  }

  axon.register( 'TEmitter', TEmitter );

  return TEmitter;
} );

