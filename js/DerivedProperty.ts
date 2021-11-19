// Copyright 2013-2021, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other Properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import Property from './Property.js';
import phetioStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import TinyProperty from './TinyProperty.js';

// constants
const DERIVED_PROPERTY_IO_PREFIX = 'DerivedPropertyIO';

/**
 * Compute the derived value given a derivation and an array of dependencies
 * @param {function} derivation
 * @param {Property[]} dependencies
 * @returns {*}
 */
const getDerivedValue = ( derivation: ( a: any ) => any, dependencies: any ) => {

  // @ts-ignore
  return derivation( ...dependencies.map( property => property.get() ) );
};

class DerivedProperty<T> extends Property<T> {
  dependencies: ( Property<any> | TinyProperty )[] | null;
  derivation: ( ...x: any[] ) => T;
  derivedPropertyListener: () => void;
  static DerivedPropertyIO: ( parameterType: any ) => any;

  /**
   * @param dependencies - Properties that this Property's value is derived from
   * @param derivation - function that derives this Property's value, expects args in the same order as dependencies
   * @param [options] - see Property
   */
  constructor( dependencies: Array<Property<any> | TinyProperty>, derivation: ( ...x: any[] ) => T, options?: any ) {

    options = merge( {
      tandem: Tandem.OPTIONAL,
      phetioReadOnly: true // derived properties can be read but not set by PhET-iO
    }, options );

    assert && options.tandem.supplied && assert( options.phetioType && options.phetioType.typeName.startsWith( DERIVED_PROPERTY_IO_PREFIX ),
      `phetioType must be provided and start with ${DERIVED_PROPERTY_IO_PREFIX}` );

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    const initialValue = getDerivedValue( derivation, dependencies );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    super( initialValue, options );

    if ( Tandem.VALIDATION && this.isPhetioInstrumented() ) {

      // The phetioType should be a concrete (instantiated) DerivedPropertyIO, hence we must check its outer type
      assert && assert( options.phetioType.typeName.startsWith( 'DerivedPropertyIO' ), 'phetioType should be DerivedPropertyIO' );
    }

    this.dependencies = dependencies;

    // We can't reset the DerivedProperty, so we don't store the initial value to help prevent memory issues.
    // See https://github.com/phetsims/axon/issues/193
    this._initialValue = null;

    this.derivation = derivation;
    this.derivedPropertyListener = this.getDerivedPropertyListener.bind( this );

    dependencies.forEach( dependency => {

      dependency.lazyLink( this.derivedPropertyListener );

      if ( dependency instanceof Property && this.isPhetioInstrumented() && dependency.isPhetioInstrumented() ) {

        // Dependencies should have taken their correct values before this DerivedProperty undefers, so it will be sure
        // to have the right value.
        // NOTE: Do not mark the beforePhase as NOTIFY, as this will potentially cause interdependence bugs when used
        // with Multilinks. See Projectile Motion's use of MeasuringTapeNode for an example.
        // @ts-ignore
        phetioStateHandlerSingleton.registerPhetioOrderDependency( dependency, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.UNDEFER );
      }
    } );
  }

  /**
   * DerivedProperty cannot have their value set externally, so this returns false.
   */
  isSettable(): boolean {
    return false;
  }

  // for bind
  private getDerivedPropertyListener(): void {

    // Just mark that there is a deferred value, then calculate the derivation below when setDeferred() is called.
    // This is in part supported by the PhET-iO state engine because it can account for intermediate states, such
    // that this Property won't notify until after it is undeferred and has taken its final value.
    if ( this.isDeferred ) {
      this.hasDeferredValue = true;
    }
    else {
      super.set( getDerivedValue( this.derivation, this.dependencies ) );
    }
  }

  dispose(): void {

    // Unlink from dependent Properties
    for ( let i = 0; i < this.dependencies!.length; i++ ) {
      const dependency = this.dependencies![ i ];
      if ( dependency.hasListener( this.derivedPropertyListener ) ) {
        dependency.unlink( this.derivedPropertyListener );
      }
    }
    this.dependencies = null;

    super.dispose();
  }

  /**
   * Override the mutators to provide an error message.  These should not be called directly,
   * the value should only be modified when the dependencies change.
   */
  set( value: T ): void {
    throw new Error( `Cannot set values directly to a DerivedProperty, tried to set: ${value}` );
  }

  /**
   * Override the mutators to provide an error message.  These should not be called directly, the value should only be modified
   * when the dependencies change. Keep the newValue output in the string so the argument won't be stripped by minifier
   * (which would cause crashes like https://github.com/phetsims/axon/issues/15)
   */
  set value( newValue ) {
    throw new Error( `Cannot es5-set values directly to a DerivedProperty, tried to set: ${newValue}` );
  }

  /**
   * Override the mutators to provide an error message.  These should not be called directly,
   * the value should only be modified when the dependencies change.
   */
  reset(): void {
    throw new Error( 'Cannot reset a DerivedProperty directly' );
  }

  /**
   * Prevent the retrieval of the initial value, since we don't store it.
   * See https://github.com/phetsims/axon/issues/193
   */
  getInitialValue(): T {
    throw new Error( 'Cannot get the initial value of a DerivedProperty' );
  }

  /**
   * Support deferred DerivedProperty by only calculating the derivation once when it is time to undefer it and fire
   * notifications. This way we don't have intermediate derivation calls during PhET-iO state setting.
   */
  setDeferred( isDeferred: boolean ) {
    assert && assert( typeof isDeferred === 'boolean' );
    if ( this.isDeferred && !isDeferred ) {
      this.deferredValue = getDerivedValue( this.derivation, this.dependencies );
    }
    return super.setDeferred( isDeferred );
  }

  /**
   * Override the getter for value as well, since we need the getter/setter pair to override the getter/setter pair in Property
   * (instead of a setter with no getter overriding). See https://github.com/phetsims/axon/issues/171 for more details
   */
  get value(): T {
    return super.get();
  }

  /**
   * Creates a derived boolean Property whose value is true iff firstProperty's value is equal to secondProperty's
   * value.
   */
  static valueEquals( firstProperty: Property<any>, secondProperty: Property<any>, options?: any ): DerivedProperty<boolean> {
    return new DerivedProperty( [ firstProperty, secondProperty ], equalsFunction, options );
  }

  /**
   * Creates a derived boolean Property whose value is true iff every input Property value is true.
   */
  static and( properties: Property<boolean>[], options?: any ): DerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    // @ts-ignore
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
  static or( properties: Property<boolean>[], options?: any ): DerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    // @ts-ignore
    return new DerivedProperty<boolean>( properties, _.reduce.bind( null, properties, orFunction, false ), options );
  }

  /**
   * Creates a derived boolean Property whose value is the inverse of the provided property.
   */
  static not( propertyToInvert: Property<boolean>, options?: any ): DerivedProperty<boolean> {
    return new DerivedProperty( [ propertyToInvert ], ( x: boolean ) => !x, options );
  }
}

const equalsFunction = ( a: any, b: any ): boolean => {
  return a === b;
};

const andFunction = ( value: any, property: Property<any> ) => {
  assert && assert( typeof property.value === 'boolean', 'boolean value required' );
  return value && property.value;
};

const orFunction = ( value: any, property: Property<any> ) => {
  assert && assert( typeof property.value === 'boolean', 'boolean value required' );
  return value || property.value;
};

// Cache each parameterized DerivedPropertyIO so that it is only created once.
const cache = new Map<IOType, IOType>();

/**
 * Parametric IO Type constructor.  Given an parameter type, this function returns an appropriate DerivedProperty
 * IO Type. Unlike PropertyIO, DerivedPropertyIO cannot be set by PhET-iO clients.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 */
DerivedProperty.DerivedPropertyIO = parameterType => {
  assert && assert( parameterType, 'DerivedPropertyIO needs parameterType' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `${DERIVED_PROPERTY_IO_PREFIX}<${parameterType.typeName}>`, {
      valueType: DerivedProperty,
      parameterTypes: [ parameterType ],
      supertype: Property.PropertyIO( parameterType ),
      documentation: 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                     'instances',

      // Override the parent implementation as a no-op.  DerivedProperty values appear in the state, but should not be set
      // back into a running simulation. See https://github.com/phetsims/phet-io/issues/1292
      applyState: () => { },
      methods: {
        setValue: {
          returnType: VoidIO,
          parameterTypes: [ parameterType ],

          // @ts-ignore
          implementation: function( value ) {

            // @ts-ignore
            return this.set( value );
          },
          documentation: 'Errors out when you try to set a derived property.',
          invocableForReadOnlyElements: false
        }
      }
    } ) );
  }

  return cache.get( parameterType );
};

axon.register( 'DerivedProperty', DerivedProperty );
export default DerivedProperty;