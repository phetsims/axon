// Copyright 2022, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. Unified interface for usage across the concrete implementations:
 * - Emitter: PhET-iO instrumented Emitter
 * - TinyEmitter: Lightweight version without phet-io for when performance/memory are critical
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

// undefined and never are not allowed as parameters to Emitter
export type IEmitterParameter = Exclude<IntentionalAny, undefined | never>;

export type IEmitterListener<T extends IEmitterParameter[]> = ( ...args: T ) => void;

type IEmitter<T extends IEmitterParameter[] = []> = {

  // For all the methods, please see documentation in Emitter.ts
  emit: ( ...args: T ) => void;
  addListener: ( listener: IEmitterListener<T> ) => void;
  removeListener: ( listener: IEmitterListener<T> ) => void;
  dispose: () => void;
  removeAllListeners: () => void;
  hasListener: ( listener: IEmitterListener<T> ) => boolean;
  hasListeners: () => boolean;
  getListenerCount: () => number;
};

export default IEmitter;