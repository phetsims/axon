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
  var axon = require( 'AXON/axon' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );

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
      assertInstanceOf( emitter, phet.axon.Emitter );

      TObject.call( this, emitter, phetioID );
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

