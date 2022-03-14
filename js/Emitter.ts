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
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import PickOptional from '../../phet-core/js/types/PickOptional.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import PhetioDataHandler, { PhetioDataHandlerOptions } from '../../tandem/js/PhetioDataHandler.js';
import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';
import Tandem from '../../tandem/js/Tandem.js';

// By default, Emitters are not stateful
// By default, Emitters are not stateful
const PHET_IO_STATE_DEFAULT = false;

// undefined and never are not allows as parameters to Emitter
type EmitterParameter = Exclude<IntentionalAny, undefined | never>;

type Listener<T extends EmitterParameter[]> = ( ...args: T ) => void;

type SelfOptions = {};
type EmitterOptions = SelfOptions & Omit<PhetioDataHandlerOptions, 'phetioOuterType'> & PickOptional<PhetioDataHandlerOptions, 'phetioOuterType'>;

export default class Emitter<T extends EmitterParameter[] = []> extends PhetioDataHandler<T> {

  // provide Emitter functionality via composition
  private readonly tinyEmitter: TinyEmitter<T>;

  static EmitterIO: ( parameterTypes: IOType[] ) => IOType;

  constructor( providedOptions?: EmitterOptions ) {

    const options = optionize<EmitterOptions, SelfOptions, PhetioDataHandlerOptions, 'phetioOuterType'>( {
      phetioOuterType: Emitter.EmitterIO,
      phetioState: PHET_IO_STATE_DEFAULT
    }, providedOptions );

    super( options );
    this.tinyEmitter = new TinyEmitter();
  }

  /**
   * Emit to notify listeners
   */
  emit( ...args: T ): void {
    assert && assert( this.tinyEmitter instanceof TinyEmitter, 'Emitter should not emit until constructor complete' );
    assert && this.validateArguments( ...args );

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', {
      getData: () => this.getPhetioData( ...args ) // put this in a closure so that it is only called in phet-io brand
    } );

    this.tinyEmitter.emit( ...args );

    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  dispose(): void {
    this.tinyEmitter.dispose();
    super.dispose();
  }

  /**
   * Adds a listener which will be called during emit.
   */
  addListener( listener: Listener<T> ): void {
    this.tinyEmitter.addListener( listener );
  }

  /**
   * Removes a listener
   */
  removeListener( listener: Listener<T> ): void {
    this.tinyEmitter.removeListener( listener );
  }

  /**
   * Removes all the listeners
   */
  removeAllListeners(): void {
    this.tinyEmitter.removeAllListeners();
  }

  /**
   * Checks whether a listener is registered with this Emitter
   */
  hasListener( listener: Listener<T> ): boolean {
    return this.tinyEmitter.hasListener( listener );
  }

  /**
   * Returns true if there are any listeners.
   */
  hasListeners(): boolean {
    return this.tinyEmitter.hasListeners();
  }

  /**
   * Returns the number of listeners.
   */
  getListenerCount(): number {
    return this.tinyEmitter.getListenerCount();
  }
}

const getTypeName = ( ioType: IOType ) => ioType.typeName;

// {Map.<string, IOType>} - Cache each parameterized IOType so that
// it is only created once.
const cache = new Map<string, IOType>();

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

  const key = parameterTypes.map( getTypeName ).join( ',' );

  if ( !cache.has( key ) ) {
    cache.set( key, new IOType( `EmitterIO<${parameterTypes.map( getTypeName ).join( ', ' )}>`, {
      valueType: Emitter,
      documentation: 'Emits when an event occurs and calls added listeners.',
      parameterTypes: parameterTypes,
      events: [ 'emitted' ],
      metadataDefaults: {
        phetioState: PHET_IO_STATE_DEFAULT
      },
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
  return cache.get( key )!;
};

axon.register( 'Emitter', Emitter );
