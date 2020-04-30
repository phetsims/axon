// Copyright 2014-2020, University of Colorado Boulder

/**
 * A Multilink is an instance that can be used to link to multiple properties.  It is very similar to a DerivedProperty,
 * but has no value and does not conform to the Property API because it is intended for use with callbacks that do not
 * compute a value.  Multilink should not be created through calling its constructor directly, but through the
 * Property.multilink and Property.lazyMultilink functions.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import inherit from '../../phet-core/js/inherit.js';
import axon from './axon.js';

/**
 * @param {Property[]} dependencies
 * @param {function} callback function that expects args in the same order as dependencies
 * @param {boolean} [lazy] Optional parameter that can be set to true if this should be a lazy multilink (no immediate callback)
 * @constructor
 */
function Multilink( dependencies, callback, lazy ) {

  this.dependencies = dependencies; // @private

  assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

  const self = this;

  // @private Keep track of listeners so they can be detached
  this.dependencyListeners = [];

  // When a dependency value changes, update the list of dependencies and call back to the callback
  dependencies.forEach( function( dependency, i ) {
    const listener = function( value ) {

      // don't call listener if this Multilink has been disposed, see https://github.com/phetsims/axon/issues/192
      if ( !self.isDisposed ) {
        callback.apply( null, dependencies.map( function( property ) {return property.get();} ) );
      }
    };
    self.dependencyListeners.push( listener );
    dependency.lazyLink( listener, {

      // All other dependencies should undefer (taking deferred value) before this dependency notifies. This is
      // crucial to prevent this Multilink callback from firing with intermediate (buggy) states before all dependencies
      // have taken their final value.
      phetioDependencies: _.without( dependencies, dependency )
    } );
  } );

  // Send initial call back but only if we are non-lazy
  if ( !lazy ) {
    callback.apply( null, dependencies.map( function( property ) {return property.get();} ) );
  }

  // @private - whether the Multilink has been disposed
  this.isDisposed = false;
}

axon.register( 'Multilink', Multilink );

inherit( Object, Multilink, {

  // @public
  dispose: function() {
    assert && assert( this.dependencies, 'A Multilink cannot be disposed twice.' );

    // Unlink from dependent properties
    for ( let i = 0; i < this.dependencies.length; i++ ) {
      const dependency = this.dependencies[ i ];
      if ( !dependency.isDisposed ) {
        dependency.unlink( this.dependencyListeners[ i ] );
      }
    }
    this.dependencies = null;
    this.dependencyListeners = null;
    this.isDisposed = true;
  }
} );

export default Multilink;