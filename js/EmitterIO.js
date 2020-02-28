// Copyright 2017-2020, University of Colorado Boulder

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

import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import ActionIO from './ActionIO.js';
import axon from './axon.js';

// constants
const EMITTER_IO_VALIDATOR = {
  isValidValue: v => {
    const Emitter = window.phet ? phet.axon.Emitter : axon.Emitter;
    return v instanceof Emitter;
  }
};

// {Object.<parameterTypeNames:string, function(new:ObjectIO)>} - Cache each parameterized EmitterIO so
// that it is only created once.
const cache = {};

/**
 * An notifier that fires listeners
 * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
 * @param {function(new:ObjectIO)[]} parameterTypes
 * @returns {function(new:ObjectIO)}
 */
function EmitterIO( parameterTypes ) {
  assert && assert( parameterTypes, 'parameterTypes should be defined' );

  const key = parameterTypes.map( typeIO => typeIO.typeName ).join( ',' );
  if ( !cache.hasOwnProperty( key ) ) {
    cache[ key ] = create( parameterTypes );
  }

  return cache[ key ];
}

/**
 * Creates an EmitterIOImpl
 * @param {function(new:ObjectIO)[]} parameterTypes
 * @returns {function(new:ObjectIO)}
 */
const create = parameterTypes => {

  /**
   * IO type for Emitter
   *
   * @param {function(new:ObjectIO)[]} parameterTypes
   * @returns {{function(new:ObjectIO)} - the parameterized Emitter
   */
  class EmitterIOImpl extends ActionIO( parameterTypes ) {}

  EmitterIOImpl.methods = {
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
  };

  EmitterIOImpl.documentation = 'Emits when an event occurs and calls added listeners.';
  EmitterIOImpl.parameterTypes = parameterTypes;
  EmitterIOImpl.validator = EMITTER_IO_VALIDATOR;
  EmitterIOImpl.typeName = `EmitterIO<${parameterTypes.map( param => param.typeName ).join( ', ' )}>`;
  ObjectIO.validateSubtype( EmitterIOImpl );

  return EmitterIOImpl;
};

axon.register( 'EmitterIO', EmitterIO );
export default EmitterIO;