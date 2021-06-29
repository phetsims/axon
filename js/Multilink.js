// Copyright 2014-2021, University of Colorado Boulder

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

// constants
const GET_PROPERTY_VALUE = property => property.get();

class Multilink {

  /**
   * @param {Array.<Property|TinyProperty>} dependencies
   * @param {function} callback function that expects args in the same order as dependencies
   * @param {boolean} [lazy] Optional parameter that can be set to true if this should be a lazy multilink (no immediate callback)
   */
  constructor( dependencies, callback, lazy ) {

    this.dependencies = dependencies; // @private

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    // @private {Map.<Property,function>} Keep track of listeners so they can be detached
    this.dependencyListeners = new Map();

    // When a dependency value changes, update the list of dependencies and call back to the callback
    dependencies.forEach( dependency => {
      const listener = () => {

        // don't call listener if this Multilink has been disposed, see https://github.com/phetsims/axon/issues/192
        if ( !this.isDisposed ) {
          callback( ...dependencies.map( GET_PROPERTY_VALUE ) );
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
      callback( ...dependencies.map( GET_PROPERTY_VALUE ) );
    }

    // @private - whether the Multilink has been disposed
    this.isDisposed = false;
  }

  // @public
  dispose() {
    assert && assert( this.dependencies, 'A Multilink cannot be disposed twice.' );

    // Unlink from dependent properties
    for ( let i = 0; i < this.dependencies.length; i++ ) {
      const dependency = this.dependencies[ i ];
      const listener = this.dependencyListeners.get( dependency );
      if ( dependency.hasListener( listener ) ) {
        dependency.unlink( listener );
      }
    }
    this.dependencies = null;
    this.dependencyListeners.clear();
    this.dependencyListeners = null;
    this.isDisposed = true;
  }
}

axon.register( 'Multilink', Multilink );

export default Multilink;