// Copyright 2014-2023, University of Colorado Boulder

/**
 * Multilink is used to link to multiple properties.  It is very similar to a DerivedProperty, but has no value and
 * does not conform to the Property API because it is intended for use with callbacks that do not compute a value.
 *
 * For situations where a reference to the Multilink instance is not needed (for calling dispose), use convenience
 * methods Multilink.multilink or Property.lazyLink to avoid these types of lint errors:
 *
 * // lint error: Do not use 'new' for side effects (no-new)
 * new Multilink( ... );
 *
 * // lint error: 'multilink' is assigned a value but never used (no-unused-vars)
 * const multilink = new Multilink( ... );
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';

// Shorthand to make the type definitions more legible
type ROP<T> = TReadOnlyProperty<T>;

// Exported for the convenience usage sites in Multilink.multilink
export type RP1<T1> = Readonly<[ ROP<T1> ]>;
export type RP2<T1, T2> = Readonly<[ ROP<T1>, ROP<T2> ]>;
export type RP3<T1, T2, T3> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3> ]>;
export type RP4<T1, T2, T3, T4> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4> ]>;
export type RP5<T1, T2, T3, T4, T5> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5> ]>;
export type RP6<T1, T2, T3, T4, T5, T6> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6> ]>;
export type RP7<T1, T2, T3, T4, T5, T6, T7> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7> ]>;
export type RP8<T1, T2, T3, T4, T5, T6, T7, T8> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8> ]>;
export type RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9> ]>;
export type RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10> ]>;
export type RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10>, ROP<T11> ]>;
export type RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10>, ROP<T11>, ROP<T12> ]>;
export type RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10>, ROP<T11>, ROP<T12>, ROP<T13> ]>;
export type RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10>, ROP<T11>, ROP<T12>, ROP<T13>, ROP<T14> ]>;
export type RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> = Readonly<[ ROP<T1>, ROP<T2>, ROP<T3>, ROP<T4>, ROP<T5>, ROP<T6>, ROP<T7>, ROP<T8>, ROP<T9>, ROP<T10>, ROP<T11>, ROP<T12>, ROP<T13>, ROP<T14>, ROP<T15> ]>;

export type Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> =
  RP1<T1> |
  RP2<T1, T2> |
  RP3<T1, T2, T3> |
  RP4<T1, T2, T3, T4> |
  RP5<T1, T2, T3, T4, T5> |
  RP6<T1, T2, T3, T4, T5, T6> |
  RP7<T1, T2, T3, T4, T5, T6, T7> |
  RP8<T1, T2, T3, T4, T5, T6, T7, T8> |
  RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9> |
  RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> |
  RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> |
  RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> |
  RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13> |
  RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14> |
  RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>;

// Marker-like interface for use with Multilink.unmultilink.  This provides type safety to make sure unmultilink is called
// with a type-safe argument.
export type UnknownMultilink = Multilink<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>;

export default class Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> {

  private dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> | null;

  // Keep track of listeners so they can be detached
  private dependencyListeners: Map<TReadOnlyProperty<unknown>, () => void>;

  // whether the Multilink has been disposed
  private isDisposed?: boolean;

  /**
   * @param dependencies
   * @param callback function that expects args in the same order as dependencies
   * @param [lazy] Optional parameter that can be set to true if this should be a lazy multilink (no immediate callback)
   */
  public constructor( dependencies: RP1<T1>, callback: ( ...params: [ T1 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP2<T1, T2>, callback: ( ...params: [ T1, T2 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP3<T1, T2, T3>, callback: ( ...params: [ T1, T2, T3 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP4<T1, T2, T3, T4>, callback: ( ...params: [ T1, T2, T3, T4 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP5<T1, T2, T3, T4, T5>, callback: ( ...params: [ T1, T2, T3, T4, T5 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP6<T1, T2, T3, T4, T5, T6>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP7<T1, T2, T3, T4, T5, T6, T7>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP8<T1, T2, T3, T4, T5, T6, T7, T8>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void, lazy?: boolean ) ;
  public constructor( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void, lazy?: boolean );
  public constructor( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void, lazy?: boolean ) {

    this.dependencies = dependencies;

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    this.dependencyListeners = new Map();

    // When a dependency value changes, update the list of dependencies and call back to the callback
    dependencies.forEach( dependency => {
      const listener = () => {

        // don't call listener if this Multilink has been disposed, see https://github.com/phetsims/axon/issues/192
        if ( !this.isDisposed ) {

          const values = dependencies.map( dependency => dependency.get() ) as [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ];
          callback( ...values );
        }
      };
      this.dependencyListeners.set( dependency, listener );
      dependency.lazyLink( listener, {

        // All other dependencies should undefer (taking deferred value) before this dependency notifies. This is
        // crucial to prevent this Multilink callback from firing with intermediate (buggy) states before all dependencies
        // have taken their final value.
        phetioDependencies: _.without( dependencies, dependency )
      } );
    } );

    // Send initial call back but only if we are non-lazy
    if ( !lazy ) {

      const values = dependencies.map( dependency => dependency.get() ) as [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ];
      callback( ...values );
    }

    this.isDisposed = false;
  }

  /**
   * Returns dependencies that are guaranteed to be defined internally.
   */
  private get definedDependencies(): Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> {
    assert && assert( this.dependencies !== null, 'Dependencies should be defined, has this Property been disposed?' );
    return this.dependencies!;
  }

  public dispose(): void {
    assert && assert( this.dependencies, 'A Multilink cannot be disposed twice.' );

    const dependencies = this.definedDependencies;

    // Unlink from dependent properties
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];
      const listener = this.dependencyListeners.get( dependency )!;
      assert && assert( listener, 'The listener should exist' );

      if ( dependency.hasListener( listener ) ) {
        dependency.unlink( listener );
      }
    }
    this.dependencies = null;
    this.dependencyListeners.clear();
    this.isDisposed = true;
  }


  /**
   * Registers a listener with multiple properties, then notifies the listener immediately.
   * @param dependencies
   * @param callback function that takes values from the properties and returns nothing
   */
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP1<T1>, callback: ( ...params: [ T1 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP2<T1, T2>, callback: ( ...params: [ T1, T2 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP3<T1, T2, T3>, callback: ( ...params: [ T1, T2, T3 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP4<T1, T2, T3, T4>, callback: ( ...params: [ T1, T2, T3, T4 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP5<T1, T2, T3, T4, T5>, callback: ( ...params: [ T1, T2, T3, T4, T5 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP6<T1, T2, T3, T4, T5, T6>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP7<T1, T2, T3, T4, T5, T6, T7>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP8<T1, T2, T3, T4, T5, T6, T7, T8>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> { // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    return new Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies, callback, false /* lazy */ );
  }

  /**
   * Create a Multilink from a dynamic or unknown number of dependencies.
   */
  public static multilinkAny( dependencies: Readonly<TReadOnlyProperty<unknown>[]>, callback: () => void ): UnknownMultilink {

    // @ts-expect-error
    return new Multilink( dependencies, callback );
  }

  /**
   * Registers a listener with multiple properties *without* an immediate callback with current values.
   * @param dependencies
   * @param callback function that takes values from the properties and returns nothing
   */
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP1<T1>, callback: ( ...params: [ T1 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP2<T1, T2>, callback: ( ...params: [ T1, T2 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP3<T1, T2, T3>, callback: ( ...params: [ T1, T2, T3 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP4<T1, T2, T3, T4>, callback: ( ...params: [ T1, T2, T3, T4 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP5<T1, T2, T3, T4, T5>, callback: ( ...params: [ T1, T2, T3, T4, T5 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP6<T1, T2, T3, T4, T5, T6>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP7<T1, T2, T3, T4, T5, T6, T7>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP8<T1, T2, T3, T4, T5, T6, T7, T8>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>; // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  static lazyMultilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, callback: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => void ): Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> { // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    return new Multilink<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( dependencies, callback, true /* lazy */ );
  }

  /**
   * Create a lazy Multilink from a dynamic or unknown number of dependencies.
   */
  public static lazyMultilinkAny( dependencies: Readonly<TReadOnlyProperty<unknown>[]>, callback: () => void ): UnknownMultilink {

    // @ts-expect-error
    return new Multilink( dependencies, callback, true /* lazy */ );
  }

  /**
   * Unlinks a listener that was added with multilink or lazyMultilink.
   */
  public static unmultilink( multilink: UnknownMultilink ): void {
    multilink.dispose();
  }
}

axon.register( 'Multilink', Multilink );
