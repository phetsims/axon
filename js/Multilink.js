// Copyright 2014-2016, University of Colorado Boulder

/**
 * A Multilink is an instance that can be used to link to multiple properties.  It is very similar to a DerivedProperty,
 * but has no value and does not conform to the Property API because it is intended for use with callbacks that do not
 * compute a value.  Multilink should not be created through calling its constructor directly, but through the
 * Property.multilink and Property.lazyMultilink functions.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {Property[]} dependencies
   * @param {function} callback function that expects args in the same order as dependencies
   * @param {boolean} [lazy] Optional parameter that can be set to true if this should be a lazy multilink (no immediate callback)
   * @constructor
   */
  function Multilink( dependencies, callback, lazy ) {

    this.dependencies = dependencies; // @private

    var self = this;

    // @private Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    //When a dependency value changes, update the list of dependencies and call back to the callback
    dependencies.forEach( function( dependency, i ) {
      var listener = function( value ) {

        // don't call listener if this Multilink has been disposed, see https://github.com/phetsims/axon/issues/192
        if ( !self.isDisposed ) {
          callback.apply( null, dependencies.map( function( property ) {return property.get();} ) );
        }
      };
      self.dependencyListeners.push( listener );
      dependency.lazyLink( listener );
    } );

    //Send initial call back but only if we are non-lazy
    if ( !lazy ) {
      callback.apply( null, dependencies.map( function( property ) {return property.get();} ) );
    }

    // @private - whether the Multilink has been disposed
    this.isDisposed = false;
  }

  axon.register( 'Multilink', Multilink );

  return inherit( Object, Multilink, {

    // @public
    dispose: function() {
      assert && assert( this.dependencies, 'A Multilink cannot be disposed twice.' );

      // Unlink from dependent properties
      for ( var i = 0; i < this.dependencies.length; i++ ) {
        var dependency = this.dependencies[ i ];
        if ( !dependency.isDisposed ) {
          dependency.unlink( this.dependencyListeners[ i ] );
        }
      }
      this.dependencies = null;
      this.dependencyListeners = null;
      this.isDisposed = true;
    }
  } );
} );