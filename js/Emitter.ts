// Copyright 2019-2022, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. The type provides extra functionality beyond just notifying
 * listeners. It adds PhET-iO instrumentation capabilities as well as validation. For the lightest-weight, fastest
 * solution with the smallest memory footprint, see `TinyEmitter`.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import optionize from '../../phet-core/js/optionize.js';
import IntentionalAny from '../../phet-core/js/IntentionalAny.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import Action, { ActionOptions } from './Action.js';
import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

type Listener<T extends IntentionalAny[]> = ( ...args: T ) => void;

type EmitterSelfOptions = {
  onBeforeNotify?: ( () => void ) | null
};
type EmitterOptions = EmitterSelfOptions & ActionOptions;

class Emitter<T extends IntentionalAny[] = []> extends Action<T> {

  private readonly tinyEmitter: TinyEmitter<T>;

  static EmitterIO: ( parameterTypes: IOType[] ) => IOType;

  constructor( providedOptions?: EmitterOptions ) {

    const options = optionize<EmitterOptions, EmitterSelfOptions, ActionOptions>( {

      phetioOuterType: Emitter.EmitterIO,

      // if specified, runs before listeners are notified. Typically used to ensure a consistent state or accomplish any
      // work that must be done before any listeners are notified.
      onBeforeNotify: null
    }, providedOptions );

    super( ( ...args: T ) => {
      assert && assert( self.tinyEmitter instanceof TinyEmitter,
        'Emitter should not emit until after its constructor has completed' );

      self.tinyEmitter.emit( ...args );
    }, options );

    const self = this;

    // provide Emitter functionality via composition
    this.tinyEmitter = new TinyEmitter( options.onBeforeNotify );
  }

  /**
   * Emitter instances should not be calling Action.execute, instead see Emitter.emit().
   * See the second half of https://github.com/phetsims/axon/issues/243 for discussion.
   */
  execute() {
    assert && assert( false, 'This should not be called, use Emitter.emit() instead.' );
  }

  /**
   * Emit to notify listeners; implemented by executing the action of the parent class.
   */
  emit( ...args: T ) {
    super.execute.apply( this, args );
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  dispose() {
    this.tinyEmitter.dispose();
    super.dispose();
  }

  /**
   * Adds a listener which will be called during emit.
   */
  addListener( listener: Listener<T> ) {
    this.tinyEmitter.addListener( listener );
  }

  /**
   * Removes a listener
   */
  removeListener( listener: Listener<T> ) {
    this.tinyEmitter.removeListener( listener );
  }

  /**
   * Removes all the listeners
   */
  removeAllListeners() {
    this.tinyEmitter.removeAllListeners();
  }

  /**
   * Checks whether a listener is registered with this Emitter
   */
  hasListener( listener: Listener<T> ) {
    return this.tinyEmitter.hasListener( listener );
  }

  /**
   * Returns true if there are any listeners.
   */
  hasListeners() {
    return this.tinyEmitter.hasListeners();
  }

  /**
   * Returns the number of listeners.
   */
  getListenerCount() {
    return this.tinyEmitter.getListenerCount();
  }
}

const paramToTypeName = ( param: IOType ) => param.typeName;

// {Map.<string, IOType>} - Cache each parameterized IOType so that
// it is only created once.
const cache = new Map();

/**
 * IO Type for Emitter.
 *
 * Providing validators to instrumented Emitters:
 * Instrumented Emitters should have their `validators` for each argument passed via EmitterIO (the phetioType).
 * To provide validators, there are two methods. First, by default each IOType has its own
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
Emitter.EmitterIO = parameterTypes => {

  const key = parameterTypes.map( paramToTypeName ).join( ',' );

  if ( !cache.has( key ) ) {
    cache.set( key, new IOType( `EmitterIO<${parameterTypes.map( paramToTypeName ).join( ', ' )}>`, {
      valueType: Emitter,
      supertype: Action.ActionIO( parameterTypes ),
      documentation: 'Emits when an event occurs and calls added listeners.',
      parameterTypes: parameterTypes,
      methods: {
        addListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, parameterTypes ) ],
          implementation: function( this: Emitter, listener: Listener<any> ) {
            this.addListener( listener );
          },
          documentation: 'Adds a listener which will be called when the emitter emits.'
        },
        removeListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, parameterTypes ) ],
          implementation: function( this: Emitter, listener: Listener<any> ) {
            this.removeListener( listener );
          },
          documentation: 'Remove a listener.'
        },
        emit: {
          returnType: VoidIO,
          parameterTypes: parameterTypes,

          // Match `Emitter.emit`'s dynamic number of arguments
          implementation: function( this: Emitter, ...args: any[] ) {

            // @ts-ignore
            this.emit( ...args );
          },
          documentation: 'Emits a single event to all listeners.',
          invocableForReadOnlyElements: false
        }
      }
    } ) );
  }
  return cache.get( key );
};

axon.register( 'Emitter', Emitter );
export default Emitter;