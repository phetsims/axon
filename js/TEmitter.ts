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
export type TEmitterParameter = Exclude<IntentionalAny, undefined | never>;

export type TEmitterListener<T extends TEmitterParameter[]> = ( ...args: T ) => void;

type TEmitter<T extends TEmitterParameter[] = []> = {

  // For all the methods, please see documentation in Emitter.ts
  emit: ( ...args: T ) => void;

  addListener: ( listener: TEmitterListener<T> ) => void;
  hasListener: ( listener: TEmitterListener<T> ) => boolean;

  removeListener: ( listener: TEmitterListener<T> ) => void;
  removeAllListeners: () => void;

  dispose: () => void;
};

export default TEmitter;