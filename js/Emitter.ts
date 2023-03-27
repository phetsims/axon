// Copyright 2019-2023, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. The type provides extra functionality beyond just notifying
 * listeners. It adds PhET-iO instrumentation capabilities as well as validation. For the lightest-weight, fastest
 * solution with the smallest memory footprint, see `TinyEmitter`.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import PhetioDataHandler, { PhetioDataHandlerOptions } from '../../tandem/js/PhetioDataHandler.js';
import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';
import Tandem from '../../tandem/js/Tandem.js';
import TEmitter, { TEmitterListener, TEmitterParameter } from './TEmitter.js';

// By default, Emitters are not stateful
const PHET_IO_STATE_DEFAULT = false;

type SelfOptions = EmptySelfOptions;
type EmitterOptions = SelfOptions & StrictOmit<PhetioDataHandlerOptions, 'phetioOuterType'>;

export default class Emitter<T extends TEmitterParameter[] = []> extends PhetioDataHandler<T> implements TEmitter<T> {

  // provide Emitter functionality via composition
  private readonly tinyEmitter: TinyEmitter<T>;

  public constructor( providedOptions?: EmitterOptions ) {

    const options = optionize<EmitterOptions, SelfOptions, PhetioDataHandlerOptions>()( {
      phetioOuterType: Emitter.EmitterIO,
      phetioState: PHET_IO_STATE_DEFAULT
    }, providedOptions );

    super( options );
    this.tinyEmitter = new TinyEmitter( null, options.hasListenerOrderDependencies );
  }

  /**
   * Emit to notify listeners
   */
  public emit( ...args: T ): void {
    assert && assert( this.tinyEmitter instanceof TinyEmitter, 'Emitter should not emit until constructor complete' );
    assert && this.validateArguments( ...args );

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', {
      data: this.getPhetioData( ...args )
    } );

    this.tinyEmitter.emit( ...args );

    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  public override dispose(): void {
    this.tinyEmitter.dispose();
    super.dispose();
  }

  /**
   * Adds a listener which will be called during emit.
   */
  public addListener( listener: TEmitterListener<T> ): void {
    this.tinyEmitter.addListener( listener );
  }

  /**
   * Removes a listener
   */
  public removeListener( listener: TEmitterListener<T> ): void {
    this.tinyEmitter.removeListener( listener );
  }

  /**
   * Removes all the listeners
   */
  public removeAllListeners(): void {
    this.tinyEmitter.removeAllListeners();
  }

  /**
   * Checks whether a listener is registered with this Emitter
   */
  public hasListener( listener: TEmitterListener<T> ): boolean {
    return this.tinyEmitter.hasListener( listener );
  }

  /**
   * Returns true if there are any listeners.
   */
  public hasListeners(): boolean {
    return this.tinyEmitter.hasListeners();
  }

  /**
   * Returns the number of listeners.
   */
  public getListenerCount(): number {
    return this.tinyEmitter.getListenerCount();
  }

  /**
   * Convenience function for debugging a Property's value. It prints the new value on registration and when changed.
   * @param name - debug name to be printed on the console
   * @returns - the handle to the listener added in case it needs to be removed later
   */
  public debug( name: string ): TEmitterListener<T> {
    const listener = ( ...args: T ) => console.log( name, ...args );
    this.addListener( listener );
    return listener;
  }

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
  public static readonly EmitterIO = ( parameterTypes: IOType[] ): IOType => {

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
            implementation: Emitter.prototype.addListener,
            documentation: 'Adds a listener which will be called when the emitter emits.'
          },
          removeListener: {
            returnType: VoidIO,
            parameterTypes: [ FunctionIO( VoidIO, parameterTypes ) ],
            implementation: Emitter.prototype.removeListener,
            documentation: 'Remove a listener.'
          },
          emit: {
            returnType: VoidIO,
            parameterTypes: parameterTypes,

            // Match `Emitter.emit`'s dynamic number of arguments
            implementation: function( this: Emitter<unknown[]>, ...values: unknown[] ) {
              const errors = this.getValidationErrors( ...values );
              if ( errors.length > 0 ) {
                throw new Error( `Validation errors: ${errors.join( ', ' )}` );
              }
              else {
                this.emit( ...values );
              }
            },
            documentation: 'Emits a single event to all listeners.',
            invocableForReadOnlyElements: false
          }
        }
      } ) );
    }
    return cache.get( key )!;
  };
}

const getTypeName = ( ioType: IOType ) => ioType.typeName;

// {Map.<string, IOType>} - Cache each parameterized IOType so that
// it is only created once.
const cache = new Map<string, IOType>();

axon.register( 'Emitter', Emitter );
