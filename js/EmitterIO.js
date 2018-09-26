// Copyright 2016, University of Colorado Boulder

/**
 * IO type for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );

  // ifphetio
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var FunctionIO = require( 'ifphetio!PHET_IO/types/FunctionIO' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var VoidIO = require( 'ifphetio!PHET_IO/types/VoidIO' );

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   * @param {function[]} phetioArgumentTypes - If loaded by phet (not phet-io), the array will be of functions
   *                                          returned by the 'ifphetio!' plugin.
   * @returns {EmitterIOImpl}
   * @constructor
   */
  function EmitterIO( phetioArgumentTypes ) {

    assert && assert( Array.isArray( phetioArgumentTypes ) );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
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
      },
      emit: {
        returnType: VoidIO,
        parameterTypes: [],
        implementation: function() {
          this.instance.emit();
        },
        documentation: 'Emit a single event with no arguments to all added listeners.',
        invocableForReadOnlyInstances: false
      }
    }, {
      documentation: 'Emitters indicate when events have occurred, with optional arguments describing the event',
      events: [ 'emitted' ],
      parameterTypes: phetioArgumentTypes
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

