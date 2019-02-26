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
  var ValidatorDef = require( 'AXON/ValidatorDef' );
  var axon = require( 'AXON/axon' );
  var FunctionIO = require( 'TANDEM/types/FunctionIO' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // allowed keys
  var ELEMENT_KEYS = [
    'name', // {string}
    'type', // {ObjectIO}
    'documentation', // {string}
    'validator' // {ValidatorDef}
  ];

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   *
   * @param {Object[]} argumentObjects, each with {name:string, type: IO type, documentation: string}
   * @returns {EmitterIOImpl} - the parameterized type
   * @constructor
   */
  function EmitterIO( argumentObjects ) {

    assert && assert( Array.isArray( argumentObjects ) );

    var elementTypes = argumentObjects.map( function( argumentObject ) {

      // validate the look of the content
      assert && assert( argumentObject !== null && typeof argumentObject === 'object' );
      argumentObject.validator && ValidatorDef.validateValidator( argumentObject.validator );

      var keys = Object.keys( argumentObject );
      for ( let i = 0; i < keys.length; i++ ) {
        const key = keys[ i ];
        assert && assert( ELEMENT_KEYS.indexOf( key ) >= 0, 'unrecognized argumentObject key: ' + key );
      }
      assert && assert( argumentObject.type, 'required argumentObject key: type.' );

      return argumentObject.type;
    } );

    var validators = argumentObjects.map( argumentObject => argumentObject.validator || argumentObject.type.validator );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( argumentObjects, 'phetioArgumentTypes should be defined' );

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
       * {Array.<Object>} - see constructor for details on object literal keys
       */
      elements: argumentObjects,

      /**
       * {ValidatorDef[]}
       */
      validators: validators, // TODO: where is this used: https://github.com/phetsims/axon/issues/204

      validator: { isValidValue: v => v instanceof phet.axon.Emitter }
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

