// Copyright 2013-2016, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other Properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const DerivedPropertyIO = require( 'AXON/DerivedPropertyIO' );
  const Property = require( 'AXON/Property' );
  const Tandem = require( 'TANDEM/Tandem' );

  class DerivedProperty extends Property {

    /**
     * @param {Property[]} dependencies - Properties that this Property's value is derived from
     * @param {function} derivation - function that derives this Property's value, expects args in the same order as dependencies
     * @param {Object} [options] - see Property
     */
    constructor( dependencies, derivation, options ) {

      options = _.extend( {
        tandem: Tandem.optional,
        phetioType: null, // must be supplied by instantiations and must be of type DerivedPropertyIO
        phetioReadOnly: true // derived properties can be read but not set by PhET-iO
      }, options );

      const initialValue = derivation.apply( null, dependencies.map( property => property.get() ) );

      // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
      super( initialValue, options );

      this.dependencies = dependencies; // @private

      // We can't reset the DerivedProperty, so we don't store the initial value to help prevent memory issues.
      // See https://github.com/phetsims/axon/issues/193
      this._initialValue = null;

      if ( this.isPhetioInstrumented() ) {

        // The phetioType should be a concrete (instantiated) DerivedPropertyIO, hence we must check its outer type
        assert && assert( options.phetioType.outerType === DerivedPropertyIO, 'phetioType should be DerivedPropertyIO' );
      }

      const self = this;

      // @private Keep track of listeners so they can be detached
      this.dependencyListeners = [];

      for ( let i = 0; i < dependencies.length; i++ ) {
        const dependency = dependencies[ i ];
        ( dependency => {
          const listener = () => {
            super.set( derivation.apply( null, dependencies.map( property => property.get() ) ) );
          };
          self.dependencyListeners.push( listener );
          dependency.lazyLink( listener );
        } )( dependency, i );
      }
    }

    // @public
    dispose() {

      // Unlink from dependent Properties
      for ( let i = 0; i < this.dependencies.length; i++ ) {
        const dependency = this.dependencies[ i ];
        if ( !dependency.isDisposed ) {
          dependency.unlink( this.dependencyListeners[ i ] );
        }
      }
      this.dependencies = null;
      this.dependencyListeners = null;

      super.dispose( this );
    }

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @param value
     * @override
     * @public
     */
    set( value ) { throw new Error( 'Cannot set values directly to a DerivedProperty, tried to set: ' + value ); }

    /**
     * Override the mutators to provide an error message.  These should not be called directly, the value should only be modified
     * when the dependencies change. Keep the newValue output in the string so the argument won't be stripped by minifier
     * (which would cause crashes like https://github.com/phetsims/axon/issues/15)
     * @param newValue
     * @override
     * @public
     */
    set value( newValue ) { throw new Error( 'Cannot es5-set values directly to a DerivedProperty, tried to set: ' + newValue ); }

    /**
     * Override the mutators to provide an error message.  These should not be called directly,
     * the value should only be modified when the dependencies change.
     * @override
     * @public
     */
    reset() { throw new Error( 'Cannot reset a DerivedProperty directly' ); }

    /**
     * Prevent the retrieval of the initial value, since we don't store it.
     * See https://github.com/phetsims/axon/issues/193
     * @public
     * @override
     * @returns {*}
     */
    getInitialValue() { throw new Error( 'Cannot get the initial value of a DerivedProperty' ); }

    /**
     * Override the getter for value as well, since we need the getter/setter pair to override the getter/setter pair in Property
     * (instead of a setter with no getter overriding). See https://github.com/phetsims/axon/issues/171 for more details
     * TODO: is this still necessary?
     * @returns {*}
     * @override
     * @public
     */
    get value() { return super.get(); }

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
    static valueEquals( firstProperty, secondProperty, options ) {
      return new DerivedProperty( [ firstProperty, secondProperty ], equalsFunction, options );
    }

    /**
     * Creates a derived boolean Property whose value is true iff every input Property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    static and( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, andFunction, true ), options );
    }

    /**
     * Creates a derived boolean Property whose value is true iff any input Property value is true.
     * @public
     *
     * @param {Array.<Property.<boolean>>} properties
     * @param {Object} [options] - Forwarded to the DerivedProperty
     * @returns {DerivedProperty.<boolean>}
     */
    static or( properties, options ) {
      return new DerivedProperty( properties, _.reduce.bind( null, properties, orFunction, false ), options );
    }
  }

  const equalsFunction = ( a, b ) => {
    return a === b;
  };

  const andFunction = ( value, property ) => {
    assert && assert( typeof property.value === 'boolean', 'boolean value required' );
    return value && property.value;
  };

  const orFunction = ( value, property ) => {
    assert && assert( typeof property.value === 'boolean', 'boolean value required' );
    return value || property.value;
  };

  return axon.register( 'DerivedProperty', DerivedProperty );
} );