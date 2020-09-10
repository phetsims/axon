// Copyright 2019-2020, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. The type provides extra functionality beyond just notifying
 * listeners. It adds PhET-iO instrumentation capabilities as well as validation. For the lightest-weight, fastest
 * solution with the smallest memory footprint, see `TinyEmitter`.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import Action from './Action.js';
import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

class Emitter extends Action {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    options = merge( {
      phetioOuterType: Emitter.createEmitterIO
    }, options );

    super( function() {
      assert && assert( self.tinyEmitter instanceof TinyEmitter,
        'Emitter should not emit until after its constructor has completed' );

      self.tinyEmitter.emit.apply( self.tinyEmitter, arguments );
    }, options );

    const self = this;

    // @private - provide Emitter functionality via composition
    this.tinyEmitter = new TinyEmitter();
  }

  /**
   * Emitter instances should not be calling Action.execute, instead see Emitter.emit().
   * See the second half of https://github.com/phetsims/axon/issues/243 for discussion.
   * @override
   * @public
   */
  execute() {
    assert && assert( false, 'This should not be called, use Emitter.emit() instead.' );
  }

  /**
   * Emit to notify listeners; implemented by executing the action of the parent class.
   * @public
   * @params {*}
   */
  emit() {
    super.execute.apply( this, arguments );
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   * @public
   * @override
   */
  dispose() {
    this.tinyEmitter.dispose();
    super.dispose();
  }

  /**
   * Adds a listener which will be called during emit.
   * @param {function} listener
   * @public
   */
  addListener( listener ) {
    this.tinyEmitter.addListener( listener );
  }

  /**
   * Removes a listener
   * @param {function} listener
   * @public
   */
  removeListener( listener ) {
    this.tinyEmitter.removeListener( listener );
  }

  /**
   * Removes all the listeners
   * @public
   */
  removeAllListeners() {
    this.tinyEmitter.removeAllListeners();
  }

  /**
   * Checks whether a listener is registered with this Emitter
   * @param {function} listener
   * @returns {boolean}
   * @public
   */
  hasListener( listener ) {
    return this.tinyEmitter.hasListener( listener );
  }

  /**
   * Returns true if there are any listeners.
   * @returns {boolean}
   * @public
   */
  hasListeners() {
    return this.tinyEmitter.hasListeners();
  }

  /**
   * Returns the number of listeners.
   * @returns {number}
   * @public
   */
  getListenerCount() {
    return this.tinyEmitter.getListenerCount();
  }
}


const paramToTypeName = param => param.typeName;
const cache = {};

/**
 * IO Type for Emitter.
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
Emitter.createEmitterIO = parameterTypes => {

  const key = parameterTypes.map( paramToTypeName ).join( ',' );

  if ( !cache.hasOwnProperty( key ) ) {

    const ActionIOType = Action.createActionIO( parameterTypes );
    cache[ key ] = ObjectIO.createIOType( Emitter, `EmitterIO<${parameterTypes.map( paramToTypeName ).join( ', ' )}>`, {
      parentIOType: ActionIOType,
      documentation: 'Emits when an event occurs and calls added listeners.',
      parameterTypes: parameterTypes,
      methods: {
        addListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, parameterTypes ) ],
          implementation: function( listener ) {
            this.addListener( listener );
          },
          documentation: 'Adds a listener which will be called when the emitter emits.'
        },
        emit: {
          returnType: VoidIO,
          parameterTypes: parameterTypes,

          // Match `Emitter.emit`'s dynamic number of arguments
          implementation: function() {
            this.emit.apply( this, arguments );
          },
          documentation: 'Emits a single event to all listeners.',
          invocableForReadOnlyElements: false
        }
      }
    } );
  }
  return cache[ key ];
};

axon.register( 'Emitter', Emitter );
export default Emitter;