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
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
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

    assert && assert( Array.isArray( parameterTypes ) );

    /**
     * @param {Emitter} emitter
     * @param {string} phetioID
     * @constructor
     */
    const ActionIOImpl = function ActionIOImpl( emitter, phetioID ) {
      assert && assert( parameterTypes, 'phetioArgumentTypes should be defined' );

      ObjectIO.call( this, emitter, phetioID );
    };

    return phetioInherit( ObjectIO, 'ActionIO', ActionIOImpl, {
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

      /**
       * {function(new:ObjectIO)[]} - TypeIOs
       */
      parameterTypes: parameterTypes,

      validator: ACTION_IO_VALIDATOR,

      /**
       * @override
       * @param {function(new:ObjectIO)} OtherActionIO
       */
      equals: function( OtherActionIO ) {
        if ( this.typeName !== OtherActionIO.typeName ) {
          return false;
        }
        if ( this.parameterTypes.length !== OtherActionIO.parameterTypes.length ) {
          return false;
        }
        for ( let i = 0; i < this.parameterTypes.length; i++ ) {
          const thisParameterType = this.parameterTypes[ i ];
          const otherParameterType = OtherActionIO.parameterTypes[ i ];

          // TODO: is having the reciprocal here overkill?  https://github.com/phetsims/phet-io/issues/1534
          if ( !thisParameterType.equals( otherParameterType ) || !otherParameterType.equals( thisParameterType ) ) {
            return false;
          }
        }
        return this.supertype.equals( OtherActionIO.supertype ) && OtherActionIO.supertype.equals( this.supertype );
      }
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

