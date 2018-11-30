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
  var TypeDef = require( 'AXON/TypeDef' );
  var FunctionIO = require( 'TANDEM/types/FunctionIO' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // ifphetio
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );

  // allowed keys
  var ELEMENT_KEYS = [ 'name', 'type', 'documentation', 'predicate' ];

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   * TODO: predicate type is really TypeDef, not function=>boolean
   * TODO: support predicate key without `type` key?
   * TODO: https://github.com/phetsims/axon/issues/189
   *
   * @param {Object[]} argumentObjects, each with {name:string, type: IO type, documentation: string, [predicate]: function.<boolean>}
   * @returns {EmitterIOImpl} - the parameterized type
   * @constructor
   */
  function EmitterIO( argumentObjects ) {

    assert && assert( Array.isArray( argumentObjects ) );

    var argumentTypes = [];
    var elementTypes = argumentObjects.map( function( element ) {

      // validate the look of the content
      assert && assert( element instanceof Object );
      var keys = Object.keys( element );
      for ( let i = 0; i < keys.length; i++ ) {
        const key = keys[ i ];
        assert && assert( ELEMENT_KEYS.indexOf( key ) >= 0, 'unrecognized element key: ' + key );
      }
      assert && assert( element.type, 'required element key: type.' );

      // predicate overrides the type
      assert && assert( TypeDef.isTypeDef( element.predicate || element.type ), 'incorrect type specified: ' + element.type );
      argumentTypes.push( element.predicate || element.type );
      return element.type;
    } );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( argumentObjects, 'phetioArgumentTypes should be defined' );
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
      documentation: 'Emits when an event occurs. ' + ( argumentObjects.length === 0 ? 'No arguments.' : 'The arguments are:<br>' +
                     '<ol>' + argumentObjects.map( function( element ) {
          var docText = element.documentation ? '. ' + element.documentation : '';
          return '<li>' + element.name + ': ' + element.type.typeName + docText + '</li>';
        } ).join( '\n' ) + '</ol>' ),

      events: [ 'emitted' ],

      /**
       * {Array.<ObjectIO>} - typeIOs
       */
      parameterTypes: elementTypes,

      /**
       * @public
       * {Array.<function>} - list of predicate functions that will validate an value against whether it is of the
       * element IOType's core type.
       */
      argumentTypes: argumentTypes,

      /**
       * {Array.<Object>} - see constructor for details on object literal keys
       */
      elements: argumentObjects
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

