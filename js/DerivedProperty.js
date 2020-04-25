// Copyright 2013-2020, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other Properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import DerivedPropertyIO from './DerivedPropertyIO.js';
import Property from './Property.js';

class DerivedProperty extends Property {

  /**
   * @param {Property[]} dependencies - Properties that this Property's value is derived from
   * @param {function} derivation - function that derives this Property's value, expects args in the same order as dependencies
   * @param {Object} [options] - see Property
   */
  constructor( dependencies, derivation, options ) {

    options = merge( {
      tandem: Tandem.OPTIONAL,
      phetioReadOnly: true // derived properties can be read but not set by PhET-iO
    }, options );

    assert && options.tandem.supplied && assert( options.phetioType && options.phetioType.outerType === DerivedPropertyIO,
      'unsupported phetioType' );

    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    const initialValue = derivation.apply( null, dependencies.map( property => property.get() ) );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    super( initialValue, options );

    if ( this.isPhetioInstrumented() ) {

      // The phetioType should be a concrete (instantiated) DerivedPropertyIO, hence we must check its outer type
      assert && assert( options.phetioType.outerType === DerivedPropertyIO, 'phetioType should be DerivedPropertyIO' );
    }

    this.dependencies = dependencies; // @private

    // We can't reset the DerivedProperty, so we don't store the initial value to help prevent memory issues.
    // See https://github.com/phetsims/axon/issues/193
    this._initialValue = null;

    // @private
    this.derivation = derivation;

    // @private Keep track of listeners so they can be detached
    this.dependencyListeners = [];

    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];
      ( dependency => {
        const listener = () => {

          // Just mark that there is a deferred value, then calculate the derivation below when setDeferred() is called.
          // This is in part supported by the PhET-iO state engine because it can account for intermediate states, such
          // that this Property won't notify until after it is undeferred and has taken its final value.
          if ( this.isDeferred ) {
            this.hasDeferredValue = true;
          }
          else {
            super.set( derivation.apply( null, dependencies.map( property => property.get() ) ) );
          }
        };
        this.dependencyListeners.push( listener );
        dependency.lazyLink( listener );

        // Dependencies should have taken their correct values before this DerivedProperty undefers, so it will be sure to have the right value.
        // NOTE: Do not mark the beforePhase as NOTIFY, as this will potentially cause interdependence bugs when used
        // with Multlinks. See Projectile Motion's use of MeasuringTapeNode for an example.
        Property.registerOrderDependency( dependency, Property.Phase.UNDEFER, this, Property.Phase.UNDEFER );
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
   * Support deferred DerivedProperty by only calculating the derivation once when it is time to undefer it and fire
   * notifications. This way we don't have intermediate derivation calls during PhET-iO state setting.
   * @override
   * @public
   *
   * @param {boolean} isDeferred
   * @returns {function|null}
   */
  setDeferred( isDeferred ) {
    assert && assert( typeof isDeferred === 'boolean' );
    if ( this.isDeferred && !isDeferred ) {
      this.deferredValue = this.derivation.apply( null, this.dependencies.map( property => property.get() ) );
    }
    return super.setDeferred( isDeferred );
  }

  /**
   * Override the getter for value as well, since we need the getter/setter pair to override the getter/setter pair in Property
   * (instead of a setter with no getter overriding). See https://github.com/phetsims/axon/issues/171 for more details
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

axon.register( 'DerivedProperty', DerivedProperty );
export default DerivedProperty;