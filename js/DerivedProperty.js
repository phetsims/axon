// Copyright 2013-2016, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

define( function( require ) {
  'use strict';

  // modules
  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var TDerivedProperty = require( 'AXON/TDerivedProperty' );
  var Tandem = require( 'TANDEM/Tandem' );

  function equalsFunction( a, b ) {
    return a === b;
  }

  function conjunctionWithProperty( value, property ) {
    return value && property.value;
  }

  function disjunctionWithProperty( value, property ) {
    return value || property.value;
  }

  /**
   * @param {Property[]} dependencies - properties that this property's value is derived from
   * @param {function} derivation - function that derives this property's value, expects args in the same order as dependencies
   * @param {Object} [options] - see Property
   * @constructor
   */
  function DerivedProperty( dependencies, derivation, options ) {

    options = _.extend( {
      tandem: Tandem.tandemOptional()
    }, options );

    this.dependencies = dependencies; // @private

    // @private Keep track of each dependency and only update the changed value, for speed
    this.dependencyValues = dependencies.map( function( property ) {return property.get();} );

    var initialValue = derivation.apply( null, this.dependencyValues );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    Property.call( this, initialValue, _.extend( {}, options, {
      tandem: options.tandem && options.tandem.createSupertypeTandem()
    } ) );

    var self = this;

    // @private Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    for ( var i = 0; i < dependencies.length; i++ ) {
      var dependency = dependencies[ i ];
      (function( dependency, i ) {
        var listener = function( newValue ) {
          self.dependencyValues[ i ] = newValue;
          Property.prototype.set.call( self, derivation.apply( null, self.dependencyValues ) );
        };
        self.dependencyListeners.push( listener );
        dependency.lazyLink( listener );
      })( dependency, i );
    }

    // If running as phet-io and a tandem is supplied, register with tandem.
    options.tandem.supplied && options.tandem.addInstance( this, TDerivedProperty( options.phetioValueType ) );

    this.disposeDerivedProperty = function() {
      options.tandem && options.tandem.removeInstance( self );
    };
  }

  axon.register( 'DerivedProperty', DerivedProperty );

  return inherit( Property, DerivedProperty, {

    // @public
    dispose: function() {

      Property.prototype.dispose.call( this );
      this.disposeDerivedProperty();

      // TODO: Move this code to disposeDerivedProperty
      // Unlink from dependent properties
      for ( var i = 0; i < this.dependencies.length; i++ ) {
        var dependency = this.dependencies[ i ];
        dependency.unlink( this.dependencyListeners[ i ] );
      }
      this.dependencies = null;
      this.dependencyListeners = null;
      this.dependencyValues = null;
    },

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @param value
     * @override
     * @public
     */
    set: function( value ) { throw new Error( 'Cannot set values directly to a derived property, tried to set: ' + value ); },

    /**
     * Override the mutators to provide an error message.  These should not be called directly, the value should only be modified
     * when the dependencies change. Keep the newValue output in the string so the argument won't be stripped by minifier
     * (which would cause crashes like https://github.com/phetsims/axon/issues/15)
     * @param newValue
     * @override
     * @public
     */
    set value( newValue ) { throw new Error( 'Cannot es5-set values directly to a derived property, tried to set: ' + newValue ); },

    /**
     * Override get value as well to satisfy the linter which wants get/set pairs (even though it just uses the same code as the superclass).
     * @returns {*}
     * @override
     * @public
     */
    get value() {return Property.prototype.get.call( this );},

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @override
     * @public
     */
    reset: function() { throw new Error( 'Cannot reset a derived property directly' ); }
  }, {

    /**
     * Creates a derived boolean property whose value is true iff firstProperty's value is equal to secondProperty's
     * value.
     * @public
     *
     * @param {Property.<*>} firstProperty
     * @param {Property.<*>} secondProperty
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    valueEquals: function( firstProperty, secondProperty, options ) {
      return new DerivedProperty( [ firstProperty, secondProperty ], equalsFunction, options );
    },

    /**
     * Creates a derived boolean property whose value is true iff every input property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    and: function( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, conjunctionWithProperty, true ), options ); // TODO: fix
    },

    /**
     * Creates a derived boolean property whose value is true iff any input property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    or: function( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, disjunctionWithProperty, false ), options );
    }
  } );
} );