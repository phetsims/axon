// Copyright 2014-2015, University of Colorado Boulder

/**
 * A Multilink is an instance that can be used to link to multiple properties.  It is very similar to a DerivedProperty, but has no value and does not conform to the Property API,
 * because it is intended for use with callbacks that do not compute a value.  Multilink should not be created through calling its constructor directly,
 * but through the Property.multilink and Property.lazyMultilink functions.
 *
 * @author Sam Reid
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

    // @private Keep track of each dependency and only update the changed value, for speed
    this.dependencyValues = dependencies.map( function( property ) {return property.get();} );

    var multilink = this;

    // @private Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    //When a dependency value changes, update the list of dependencies and call back to the callback
    for ( var i = 0; i < dependencies.length; i++ ) {
      var dependency = dependencies[ i ];
      (function( dependency, i ) {
        var listener = function( newValue ) {
          multilink.dependencyValues[ i ] = newValue;
          callback.apply( null, multilink.dependencyValues );
        };
        multilink.dependencyListeners.push( listener );
        dependency.lazyLink( listener );
      })( dependency, i );
    }

    //Send initial call back but only if we are non-lazy
    if ( !lazy ) {
      callback.apply( null, this.dependencyValues );
    }
  }
  axon.register( 'Multilink', Multilink );

  return inherit( Object, Multilink, {

    // @public
    dispose: function() {
      // Unlink from dependent properties
      for ( var i = 0; i < this.dependencies.length; i++ ) {
        var dependency = this.dependencies[ i ];
        dependency.unlink( this.dependencyListeners[ i ] );
      }
      this.dependencies = null;
      this.dependencyListeners = null;
      this.dependencyValues = null;
    }
  } );
} );