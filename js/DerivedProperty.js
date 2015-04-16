// Copyright 2002-2013, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid
 */

define( function( require ) {
  'use strict';

  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {Property[]} dependencies properties that this property's value is derived from
   * @param {function} derivation function that derives this property's value, expects args in the same order as dependencies
   * @param {object} [options] - see code
   * @constructor
   */
  axon.DerivedProperty = function DerivedProperty( dependencies, derivation, options ) {
    this.dependencies = dependencies;

    //Keep track of each dependency and only update the changed value, for speed
    this.dependencyValues = dependencies.map( function( property ) {return property.get();} );

    var initialValue = derivation.apply( null, this.dependencyValues );
    Property.call( this, initialValue, options );

    var derivedProperty = this;

    //Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    for ( var i = 0; i < dependencies.length; i++ ) {
      var dependency = dependencies[ i ];
      (function( dependency, i ) {
        var listener = function( newValue ) {
          derivedProperty.dependencyValues[ i ] = newValue;
          Property.prototype.set.call( derivedProperty, derivation.apply( null, derivedProperty.dependencyValues ) );
        };
        derivedProperty.dependencyListeners.push( listener );
        dependency.lazyLink( listener );
      })( dependency, i );
    }
  };

  return inherit( Property, axon.DerivedProperty, {

      // Detaches this derived property from its dependencies.
      detach: function() {
        for ( var i = 0; i < this.dependencies.length; i++ ) {
          var dependency = this.dependencies[ i ];
          dependency.unlink( this.dependencyListeners[ i ] );
        }
        this.dependencies = null;
        this.dependencyListeners = null;
        this.dependencyValues = null;
      },

      //Override the mutators to provide an error message.  These should not be called directly, the value should only be modified when the dependencies change
      set: function( value ) { throw new Error( 'Cannot set values directly to a derived property, tried to set: ' + value ); },

      //Override the mutators to provide an error message.  These should not be called directly, the value should only be modified when the dependencies change
      //Keep the newValue output in the string so the argument won't be stripped by minifier (which would cause crashes like https://github.com/phetsims/axon/issues/15)
      set value( newValue ) { throw new Error( 'Cannot es5-set values directly to a derived property, tried to set: ' + newValue ); },

      //Override get value as well to satisfy the linter which wants get/set pairs (even though it just uses the same code as the superclass).
      get value() {return Property.prototype.get.call( this );},

      //Override the mutators to provide an error message.  These should not be called directly, the value should only be modified when the dependencies change
      reset: function() { throw new Error( 'Cannot reset a derived property directly' ); }
    }
  );
} );