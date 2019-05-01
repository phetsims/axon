// Copyright 2016, University of Colorado Boulder

/**
 * IO type for Emitter.
 *
 * Providing validators to instrumented Emitters:
 * Instrumented Emitters should have their `validators` for each argument passed via EmitterIO (the phetioType).
 * To provide validators, there are two methods. First, by default each TypeIO has its own
 * validator that will be used. So specifying an argument object like `{ type: NumberIO }` will automatically use
 * `NumberIO.validator` as the validator. This can be overridden with the `validator` key (second option), like
 * { type: NumberIO, validator: { isValidValue: v=> typeof v === 'number' &&  v < 5 } }`
 * NOTE: currently the implementation is either/or, if a validator is provided via the `validator` key, the validator
 * from the `type` will be ignored.
 * see https://github.com/phetsims/axon/issues/204 for more details.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ActionIO = require( 'AXON/ActionIO' );
  var axon = require( 'AXON/axon' );
  var FunctionIO = require( 'TANDEM/types/FunctionIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   *
   * @param {Object[]} argumentObjects, each with {name:string, type: IO type, documentation: string}
   * @returns {EmitterIOImpl} - the parameterized type
   * @constructor
   */
  function EmitterIO( argumentObjects ) {

    var elementTypes = argumentObjects.map( argumentObject => argumentObject.type );
    var validators = argumentObjects.map( argumentObject => argumentObject.validator || argumentObject.type.validator );

    const ActionIOImpl = ActionIO( argumentObjects );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( argumentObjects, 'phetioArgumentTypes should be defined' );

      ActionIOImpl.call( this, emitter, phetioID );
    };

    return phetioInherit( ActionIOImpl, 'EmitterIO', EmitterIOImpl, {
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

        // Match `Emitter.emit`'s dynamic number of arguments
        implementation: function() {
          this.instance.emit.apply( this.instance, arguments );
        },
        documentation: 'Emits a single event to all listeners.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Emits when an event occurs. ' + ( argumentObjects.length === 0 ? 'No arguments.' : 'The arguments are:<br>' +
                     '<ol>' + argumentObjects.map( function( element ) {
          const docText = element.documentation ? '. ' + element.documentation : '';
          return '<li>' + element.name + ': ' + element.type.typeName + docText + '</li>';
        } ).join( '\n' ) + '</ol>' ),

      /**
       * {Array.<ObjectIO>} - typeIOs
       */
      parameterTypes: elementTypes,

      /**
       * {Array.<Object>} - see constructor for details on object literal keys
       */
      elements: argumentObjects,

      /**
       * A list of validators, one for each argument that will be emitted.
       * {ValidatorDef[]}
       */
      validators: validators,  // TODO: https://github.com/phetsims/axon/issues/241 Can this be supplied by the parent?

      validator: {
        isValidValue: v => {
          // constants
          var Emitter = window.phet ? phet.axon.Emitter : axon.Emitter;
          return v instanceof Emitter;
        }
      }
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );

