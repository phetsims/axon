// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for Action.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';

const ACTION_IO_VALIDATOR = {
  isValidValue: v => {
    const Action = window.phet ? phet.axon.Action : axon.Action;
    return v instanceof Action;
  }
};
const paramToTypeName = param => param.typeName;

// {Object.<parameterTypeNames:string, function(new:ObjectIO)>} - Cache each parameterized ActionIO so that it is
// only created once.
const cache = {};

/**
 * An observable Property that triggers notifications when the value changes.
 * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
 * @param {function(new:ObjectIO)} parameterTypes
 * @returns {function(new:ObjectIO)}
 */
function ActionIO( parameterTypes ) {
  assert && assert( parameterTypes, 'parameterTypes should be defined' );

  const key = parameterTypes.map( paramToTypeName ).join( ',' );

  if ( !cache.hasOwnProperty( key ) ) {
    cache[ key ] = create( parameterTypes );
  }

  return cache[ key ];
}

/**
 * Creates a ActionIOImpl
 * @param {function(new:ObjectIO)[]} parameterTypes
 * @returns {function(new:ObjectIO)}
 */
const create = parameterTypes => {

  /**
   * IO type for Action
   *
   * @param {function(new:ObjectIO)[]} parameterTypes
   * @returns {{function(new:ObjectIO)} - the parameterized Action
   */
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
  ActionIOImpl.typeName = `ActionIO<${parameterTypes.map( paramToTypeName ).join( ', ' )}>`;
  ActionIOImpl.parameterTypes = parameterTypes;
  ObjectIO.validateSubtype( ActionIOImpl );

  return ActionIOImpl;
};

axon.register( 'ActionIO', ActionIO );
export default ActionIO;