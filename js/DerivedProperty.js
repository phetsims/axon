// Copyright 2013-2016, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other Properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var Tandem = require( 'TANDEM/Tandem' );

  /**
   * @param {Property[]} dependencies - Properties that this Property's value is derived from
   * @param {function} derivation - function that derives this Property's value, expects args in the same order as dependencies
   * @param {Object} [options] - see Property
   * @constructor
   */
  function DerivedProperty( dependencies, derivation, options ) {

    options = _.extend( {
      tandem: Tandem.optional,
      phetioState: false, // derived properties don't need to be loaded to load the state
      phetioType: null, // must be supplied by instantiations and must be of type DerivedPropertyIO
      phetioReadOnly: true // derived properties can be read but not set by PhET-iO
    }, options );

    if ( window.phet && window.phet.phetio ) {
      assert && assert( options.phetioType === null || options.phetioType.typeName.indexOf( 'DerivedPropertyIO' ) === 0, 'phetioType should be DerivedPropertyIO' );
    }

    this.dependencies = dependencies; // @private

    var initialValue = derivation.apply( null, dependencies.map( function( property ) {return property.get();} ) );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    Property.call( this, initialValue, options );

    var self = this;

    // @private Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    for ( var i = 0; i < dependencies.length; i++ ) {
      var dependency = dependencies[ i ];
      (function( dependency ) {
        var listener = function() {
          Property.prototype.set.call( self, derivation.apply( null, dependencies.map( function( property ) {return property.get();} ) ) );
        };
        self.dependencyListeners.push( listener );
        dependency.lazyLink( listener );
      })( dependency, i );
    }
  }

  axon.register( 'DerivedProperty', DerivedProperty );

  function equalsFunction( a, b ) {
    return a === b;
  }

  function andFunction( value, property ) {
    assert && assert( typeof property.value === 'boolean', 'boolean value required' );
    return value && property.value;
  }

  function orFunction( value, property ) {
    assert && assert( typeof property.value === 'boolean', 'boolean value required' );
    return value || property.value;
  }

  return inherit( Property, DerivedProperty, {

    // @public
    dispose: function() {

      // Unlink from dependent Properties
      for ( var i = 0; i < this.dependencies.length; i++ ) {
        var dependency = this.dependencies[ i ];
        dependency.unlink( this.dependencyListeners[ i ] );
      }
      this.dependencies = null;
      this.dependencyListeners = null;

      Property.prototype.dispose.call( this );
    },

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @param value
     * @override
     * @public
     */
    set: function( value ) { throw new Error( 'Cannot set values directly to a DerivedProperty, tried to set: ' + value ); },

    /**
     * Override the mutators to provide an error message.  These should not be called directly, the value should only be modified
     * when the dependencies change. Keep the newValue output in the string so the argument won't be stripped by minifier
     * (which would cause crashes like https://github.com/phetsims/axon/issues/15)
     * @param newValue
     * @override
     * @public
     */
    set value( newValue ) { throw new Error( 'Cannot es5-set values directly to a DerivedProperty, tried to set: ' + newValue ); },

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @override
     * @public
     */
    reset: function() { throw new Error( 'Cannot reset a DerivedProperty directly' ); }
  }, {

    /**
     * Creates a derived boolean Property whose value is true iff firstProperty's value is equal to secondProperty's
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
     * Creates a derived boolean Property whose value is true iff every input Property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    and: function( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, andFunction, true ), options );
    },

    /**
     * Creates a derived boolean Property whose value is true iff any input Property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    or: function( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, orFunction, false ), options );
    }
  } );
} );