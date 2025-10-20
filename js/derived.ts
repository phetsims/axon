// Copyright 2025, University of Colorado Boulder

/**
 * Convenience method to that allows you to call like:
 *
 * this.speedProperty = derived( this.velocityProperty, velocity => velocity.magnitude );
 *
 * instead of
 *
 * this.speedProperty = new DerivedProperty( [ this.velocityProperty ], velocity => velocity.magnitude );
 *
 * This file was machine-generated and is under evaluation and experimentation as described in https://github.com/phetsims/axon/issues/467
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import affirm from '../../perennial-alias/js/browser-and-node/affirm.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import DerivedProperty, { type DerivedPropertyOptions, type UnknownDerivedProperty } from './DerivedProperty.js';
import { type DependenciesType } from './Multilink.js';
import type { TReadOnlyProperty } from './TReadOnlyProperty.js';

function derived<T, T1>(
  dependency1: TReadOnlyProperty<T1>,
  derivation: ( param1: T1 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  derivation: ( param1: T1, param2: T2 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  derivation: ( param1: T1, param2: T2, param3: T3 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  dependency11: TReadOnlyProperty<T11>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10, param11: T11 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  dependency11: TReadOnlyProperty<T11>,
  dependency12: TReadOnlyProperty<T12>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10, param11: T11, param12: T12 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  dependency11: TReadOnlyProperty<T11>,
  dependency12: TReadOnlyProperty<T12>,
  dependency13: TReadOnlyProperty<T13>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10, param11: T11, param12: T12, param13: T13 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  dependency11: TReadOnlyProperty<T11>,
  dependency12: TReadOnlyProperty<T12>,
  dependency13: TReadOnlyProperty<T13>,
  dependency14: TReadOnlyProperty<T14>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10, param11: T11, param12: T12, param13: T13, param14: T14 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;
function derived<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(
  dependency1: TReadOnlyProperty<T1>,
  dependency2: TReadOnlyProperty<T2>,
  dependency3: TReadOnlyProperty<T3>,
  dependency4: TReadOnlyProperty<T4>,
  dependency5: TReadOnlyProperty<T5>,
  dependency6: TReadOnlyProperty<T6>,
  dependency7: TReadOnlyProperty<T7>,
  dependency8: TReadOnlyProperty<T8>,
  dependency9: TReadOnlyProperty<T9>,
  dependency10: TReadOnlyProperty<T10>,
  dependency11: TReadOnlyProperty<T11>,
  dependency12: TReadOnlyProperty<T12>,
  dependency13: TReadOnlyProperty<T13>,
  dependency14: TReadOnlyProperty<T14>,
  dependency15: TReadOnlyProperty<T15>,
  derivation: ( param1: T1, param2: T2, param3: T3, param4: T4, param5: T5, param6: T6, param7: T7, param8: T8, param9: T9, param10: T10, param11: T11, param12: T12, param13: T13, param14: T14, param15: T15 ) => T,
  options?: DerivedPropertyOptions<T>
): UnknownDerivedProperty<T>;

function derived<T>( ...args: unknown[] ): UnknownDerivedProperty<T> {
  affirm( args.length >= 2, 'derived requires at least one dependency and a derivation function' );

  const lastArgument = args[ args.length - 1 ];
  const secondToLastArgument = args[ args.length - 2 ];
  const options = typeof lastArgument === 'function' ? undefined : lastArgument as DerivedPropertyOptions<T>;
  const derivation = ( typeof lastArgument === 'function' ? lastArgument : secondToLastArgument ) as ( ...params: [ IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny ] ) => T;
  const optionOffset = options ? 2 : 1;

  const dependencies = args.slice( 0, args.length - optionOffset ) as unknown as DependenciesType<IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny, IntentionalAny>;

  affirm( dependencies.length > 0, 'derived requires at least one dependency' );

  return new DerivedProperty( dependencies, derivation, options ) as UnknownDerivedProperty<T>;
}

export default derived;
