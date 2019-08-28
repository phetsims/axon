// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for Action.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const ParametricTypeIO = require( 'TANDEM/types/ParametricTypeIO' );
  const phetioInherit = require( 'TANDEM/phetioInherit' );
  const VoidIO = require( 'TANDEM/types/VoidIO' );

  const ACTION_IO_VALIDATOR = {
    isValidValue: v => {
      const Action = window.phet ? phet.axon.Action : axon.Action;
      return v instanceof Action;
    }
  };

  /**
   * IO type for Emitter
   *
   * @param {function(new:ObjectIO)[]} parameterTypes
   * @returns {ActionIOImpl} - the parameterized type
   */
  function ActionIO( parameterTypes ) {

    const ParametricTypeImplIO = ParametricTypeIO( ActionIO, 'ActionIO',  parameterTypes );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     * @extends {ParametricTypeImplIO}
     */
    const ActionIOImpl = function ActionIOImpl( emitter, phetioID ) {
      assert && assert( parameterTypes, 'phetioArgumentTypes should be defined' );

      ParametricTypeImplIO.call( this, emitter, phetioID );
    };

    return phetioInherit( ParametricTypeImplIO, ParametricTypeImplIO.subtypeTypeName, ActionIOImpl, {
      execute: {
        returnType: VoidIO,
        parameterTypes: parameterTypes,

        // Match `Action.execute`'s dynamic number of arguments
        implementation: function() {
          this.phetioObject.execute.apply( this.phetioObject, arguments );
        },
        documentation: 'Executes the function the Action is wrapping.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Executes when an event occurs.',

      events: [ 'emitted' ],

      validator: ACTION_IO_VALIDATOR
    } );
  }

  /**
   * This has to be unique to other outerTypeName values, as these are used for caching in Action.js
   * @public
   * @type {string}
   */
  ActionIO.outerTypeName = 'ActionIO';

  axon.register( 'ActionIO', ActionIO );

  return ActionIO;
} );

