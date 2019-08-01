// Copyright 2017-2019, University of Colorado Boulder

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

  // constants
  const EMITTER_IO_VALIDATOR = {
    isValidValue: v => {
      var Emitter = window.phet ? phet.axon.Emitter : axon.Emitter;
      return v instanceof Emitter;
    }
  };

  /**
   * IO type for Emitter
   * Emitter for 0, 1 or 2 args, or maybe 3.
   *
   * @param {function(new:ObjectIO)[]} parameterTypes
   * @returns {EmitterIOImpl} - the parameterized type
   * @constructor
   */
  function EmitterIO( parameterTypes ) {

    const ActionIOImpl = ActionIO( parameterTypes );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    var EmitterIOImpl = function EmitterIOImpl( emitter, phetioID ) {
      assert && assert( parameterTypes, 'phetioArgumentTypes should be defined' );

      ActionIOImpl.call( this, emitter, phetioID );
    };

    return phetioInherit( ActionIOImpl, 'EmitterIO', EmitterIOImpl, {
      addListener: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, parameterTypes ) ],
        implementation: function( listener ) {
          this.phetioObject.addListener( listener );
        },
        documentation: 'Adds a listener which will be called when the emitter emits.'
      },
      emit: {
        returnType: VoidIO,
        parameterTypes: parameterTypes,

        // Match `Emitter.emit`'s dynamic number of arguments
        implementation: function() {
          this.phetioObject.emit.apply( this.phetioObject, arguments );
        },
        documentation: 'Emits a single event to all listeners.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Emits when an event occurs and calls added listeners.',

      /**
       * {Array.<ObjectIO>} - typeIOs - signify to phetioInherit.typeName computation that this type is parametric
       */
      parameterTypes: parameterTypes,

      validator: EMITTER_IO_VALIDATOR
    } );
  }

  axon.register( 'EmitterIO', EmitterIO );

  return EmitterIO;
} );