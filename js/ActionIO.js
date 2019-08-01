// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for Emitter.
 *
 * TODO: this is going to change https://github.com/phetsims/axon/issues/257
 * Providing validators to instrumented Emitters:
 * Instrumented Emitters should have their `validators` for each argument passed via ActionIO (the phetioType).
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
  var ValidatorDef = require( 'AXON/ValidatorDef' );
  var axon = require( 'AXON/axon' );
  var ObjectIO = require( 'TANDEM/types/ObjectIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // allowed keys
  var ELEMENT_KEYS = [
    'name', // {string}
    'type', // {function(new:ObjectIO)}
    'documentation', // {string}
    'validator' // {ValidatorDef} - This should be a complete validator, it will not be combined with type.validator.
  ];

  // Argument object keys involved in the definition of a unique ActionIO
  const DEFINITION_KEYS = [ 'name', 'documentation' ];

  const ACTION_IO_VALIDATOR = {
    isValidValue: v => {
      var Action = window.phet ? phet.axon.Action : axon.Action;
      return v instanceof Action;
    }
  };

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   *
   * @param {function(new:ObjectIO)[]} argumentObjects, each with {name:string, type: IO type, documentation: string, [validator]:ValidatorDef}
   * @returns {ActionIOImpl} - the parameterized type
   * @constructor
   */
  function ActionIO( argumentObjects ) {

    assert && assert( Array.isArray( argumentObjects ) );

    var elementTypes = argumentObjects.map( function( argumentObject ) {

      // validate the look of the content
      assert && assert( argumentObject !== null && typeof argumentObject === 'object' );
      assert && argumentObject.validator && ValidatorDef.validateValidator( argumentObject.validator );

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
    var ActionIOImpl = function ActionIOImpl( emitter, phetioID ) {
      assert && assert( argumentObjects, 'phetioArgumentTypes should be defined' );

      ObjectIO.call( this, emitter, phetioID );
    };

    return phetioInherit( ObjectIO, 'ActionIO', ActionIOImpl, {
      execute: {
        returnType: VoidIO,
        parameterTypes: elementTypes,

        // Match `Action.execute`'s dynamic number of arguments
        implementation: function() {
          this.phetioObject.execute.apply( this.phetioObject, arguments );
        },
        documentation: 'Executes the function the Action is wrapping.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Emits when an event occurs. ' + ( argumentObjects.length === 0 ? 'No arguments.' : 'The arguments are:<br>' +
                     '<ol>' + argumentObjects.map( function( element ) {
          var docText = element.documentation ? '. ' + element.documentation : '';
          return '<li>' + element.name + ': ' + element.type.typeName + docText + '</li>';
        } ).join( '\n' ) + '</ol>' ),

      events: [ 'emitted' ],

      /**
       * {function(new:ObjectIO)[]} - TypeIOs
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
      parameters: validators,

      validator: ACTION_IO_VALIDATOR,

      /**
       * @override
       * @param {function(new:ObjectIO)} OtherActionIO
       */
      equals: function( OtherActionIO ) {
        if ( this.typeName !== OtherActionIO.typeName ) {
          return false;
        }
        OtherActionIO.outerType === ActionIO;
        if ( this.elements.length !== OtherActionIO.elements.length ) {
          return false;
        }

        for ( let i = 0; i < this.elements.length; i++ ) {
          const actionIO1Element = _.pick( this.elements[ i ], DEFINITION_KEYS );
          const actionIO2Element = _.pick( OtherActionIO.elements[ i ], DEFINITION_KEYS );
          if ( !_.isEqual( actionIO1Element, actionIO2Element ) ) {
            return false;
          }
          if ( !this.elements[ i ].type.equals( OtherActionIO.elements[ i ].type ) ) {
            return false;
          }
        }
        return this.supertype.equals( OtherActionIO.supertype ) && OtherActionIO.supertype.equals( this.supertype );
      }
    } );
  }

  axon.register( 'ActionIO', ActionIO );

  return ActionIO;
} );

