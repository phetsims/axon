// Copyright 2022-2025, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. Unified interface for usage across the concrete implementations:
 * - Emitter: PhET-iO instrumented Emitter
 * - TinyEmitter: Lightweight version without phet-io for when performance/memory are critical
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

// undefined and never are not allowed as parameters to Emitter
export type TEmitterParameter = Exclude<IntentionalAny, undefined | never>;

export type TEmitterListener<T extends TEmitterParameter[]> = ( ...args: T ) => void;

// A "read only" version of an emitter. You can listen to it, but cannot control it
export type TReadOnlyEmitter<T extends TEmitterParameter[] = []> = {

  addListener: ( listener: TEmitterListener<T> ) => void;
  hasListener: ( listener: TEmitterListener<T> ) => boolean;

  removeListener: ( listener: TEmitterListener<T> ) => void;
  removeAllListeners: () => void;
};

type TEmitter<T extends TEmitterParameter[] = []> = TReadOnlyEmitter<T> & {

  // For all the methods, please see documentation in Emitter.ts
  emit: ( ...args: T ) => void;

  dispose: () => void;
};

export default TEmitter;