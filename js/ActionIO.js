// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for Action.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
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
    assert && assert( parameterTypes, 'phetioArgumentTypes should be defined' );

    class ActionIOImpl extends ObjectIO {
    }

    ActionIOImpl.methods = {
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
    };

    ActionIOImpl.documentation = 'Executes when an event occurs.';
    ActionIOImpl.events = [ 'emitted' ];
    ActionIOImpl.validator = ACTION_IO_VALIDATOR;
    ActionIOImpl.typeName = `ActionIO<${parameterTypes.map( param => param.typeName ).join( ', ' )}>`;
    ActionIOImpl.parameterTypes = parameterTypes;
    ObjectIO.validateSubtype( ActionIOImpl );

    return ActionIOImpl;
  }

  /**
   * This has to be unique to other outerTypeName values, as these are used for caching in Action.js
   * @public
   * @type {string}
   */
  ActionIO.outerTypeName = 'ActionIO';

  return axon.register( 'ActionIO', ActionIO );
} );

