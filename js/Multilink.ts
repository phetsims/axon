// Copyright 2014-2022, University of Colorado Boulder

/**
 * Multilink is used to link to multiple properties.  It is very similar to a DerivedProperty, but has no value and
 * does not conform to the Property API because it is intended for use with callbacks that do not compute a value.
 *
 * For situations where a reference to the Multilink instance is not needed (for calling dispose), use convenience
 * methods Property.multilink or Property.lazyLink to avoid these types of lint errors:
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
import { MappedProperties } from './DerivedProperty.js';
import IReadOnlyProperty from './IReadOnlyProperty.js';

// constants
const GET_PROPERTY_VALUE = <T>( property: IReadOnlyProperty<T> ): T => property.get();

const valuesOfProperties = <Parameters extends any[]>( dependencies: MappedProperties<Parameters> ): Parameters => {
  // Typescript can't figure out that the map gets us back to the Parameters type
  return dependencies.map( GET_PROPERTY_VALUE ) as Parameters;
};

// Type of a derivation function, that takes the typed parameters (as a tuple type)
type Callback<Parameters extends any[]> = ( ...params: Parameters ) => void;

export default class Multilink<Parameters extends any[]> {

  private dependencies: MappedProperties<Parameters> | null;
  private dependencyListeners: Map<IReadOnlyProperty<any>, () => void>;

  private isDisposed?: boolean;

  /**
   * @param dependencies
   * @param callback function that expects args in the same order as dependencies
   * @param [lazy] Optional parameter that can be set to true if this should be a lazy multilink (no immediate callback)
   */
  constructor( dependencies: MappedProperties<Parameters>, callback: Callback<Parameters>, lazy?: boolean ) {

    this.dependencies = dependencies;

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    // @private {Map.<Property,function>} Keep track of listeners so they can be detached
    this.dependencyListeners = new Map();

    // When a dependency value changes, update the list of dependencies and call back to the callback
    dependencies.forEach( dependency => {
      const listener = () => {

        // don't call listener if this Multilink has been disposed, see https://github.com/phetsims/axon/issues/192
        if ( !this.isDisposed ) {
          callback( ...valuesOfProperties( dependencies ) );
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
      callback( ...valuesOfProperties( dependencies ) );
    }

    // @private - whether the Multilink has been disposed
    this.isDisposed = false;
  }

  /**
   * Returns dependencies that are guaranteed to be defined internally.
   */
  private get definedDependencies(): MappedProperties<Parameters> {
    assert && assert( this.dependencies !== null, 'Dependencies should be defined, has this Property been disposed?' );
    return this.dependencies!;
  }

  // @public
  dispose() {
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
}

axon.register( 'Multilink', Multilink );
