// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var axon = require( 'AXON/axon' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var FunctionIO = require( 'ifphetio!PHET_IO/types/FunctionIO' );
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
  function EmitterIO( phetioArgumentTypes ) {

    var TEmitterImpl = function TEmitterImpl( emitter, phetioID ) {
      assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );
      assert && assertInstanceOf( emitter, phet.axon.Emitter );

      TObject.call( this, emitter, phetioID );
    };

    return phetioInherit( TObject, 'EmitterIO', TEmitterImpl, {
      addListener: {
        returnType: TVoid,
        parameterTypes: [ FunctionIO( TVoid, phetioArgumentTypes ) ],
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

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

