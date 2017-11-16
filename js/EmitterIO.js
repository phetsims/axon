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
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var VoidIO = require( 'ifphetio!PHET_IO/types/VoidIO' );

  /**
   * Wrapper type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   * @param {function[]} phetioArgumentTypes - If loaded by phet (not phet-io), the array will be of functions
   *                                          returned by the 'ifphetio!' plugin.
   * @returns {EmitterIOImpl}
   * @constructor
   */
  function EmitterIO( phetioArgumentTypes ) {

    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( phetioArgumentTypes, 'phetioArgumentTypes should be defined' );
      assert && assertInstanceOf( emitter, phet.axon.Emitter );

      ObjectIO.call( this, emitter, phetioID );
    };

    return phetioInherit( ObjectIO, 'EmitterIO', EmitterIOImpl, {
      addListener: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, phetioArgumentTypes ) ],
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

