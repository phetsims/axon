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
  var FunctionIO = require( 'TANDEM/types/FunctionIO' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // allowed keys
  var ELEMENT_KEYS = [ 'name', 'type', 'documentation' ];

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   * @param {Object[]} elements, each with {name:string, type: IO type, documentation: string, [predicate]: function}
   *                             - If loaded by phet (not phet-io), the array will be of functions
   *                             - returned by the 'ifphetio!' plugin.
   * @returns {EmitterIOImpl}
   * @constructor
   */
  function EmitterIO( elements ) {

    assert && assert( Array.isArray( elements ) );

    var elementTypes = elements.map( function( element ) {

      // validate the look of the content
      assert && assert( typeof element === 'object' );
      var keys = Object.keys( element );
      for ( let i = 0; i < keys.length; i++ ) {
        const key = keys[ i ];
        assert && assert( ELEMENT_KEYS.indexOf( key ) >= 0, 'unrecognized element key: ' + key );
      }
      return element.type;

    } );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( elements, 'phetioArgumentTypes should be defined' );
      assert && assertInstanceOf( emitter, phet.axon.Emitter );

      ObjectIO.call( this, emitter, phetioID );
    };

    return phetioInherit( ObjectIO, 'EmitterIO', EmitterIOImpl, {
      addListener: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, elementTypes ) ],
        implementation: function( listener ) {
          this.instance.addListener( listener );
        },
        documentation: 'Adds a listener which will be called when the emitter emits.'
      },
      emit: {
        returnType: VoidIO,
        parameterTypes: elementTypes,

        // Match Emitter.emit's dynamic number of arguments
        implementation: function() {
          this.instance.emit.apply( this.instance, arguments );
        },
        documentation: 'Emits a single event to all listeners.',
        invocableForReadOnlyInstances: false
      }
    }, {
      documentation: 'Emits when an event occurs. ' + ( elements.length === 0 ? 'No arguments.' : 'The arguments are:<br>' +
                     '<ol>' + elements.map( function( element ) {
          var docText = element.documentation ? '. ' + element.documentation : '';
          return '<li>' + element.name + ': ' + element.type.typeName + docText + '</li>';
        } ).join( '\n' ) + '</ol>' ),

      events: [ 'emitted' ],

      /**
       * {Array.<ObjectIO>} - typeIOs
       */
      parameterTypes: elementTypes,
      elements: elements
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

