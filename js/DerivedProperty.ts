// Copyright 2013-2022, University of Colorado Boulder

/**
 * A DerivedProperty is computed based on other Properties.  This implementation inherits from Property to (a) simplify
 * implementation and (b) ensure it remains consistent. Note that the setters should not be called directly, so the
 * setters (set, reset and es5 setter) throw an error if used directly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import Property, { ReadOnlyProperty, PropertyOptions } from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import IReadOnlyProperty from './IReadOnlyProperty.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import optionize from '../../phet-core/js/optionize.js';
import { Dependencies, RP1, RP10, RP11, RP12, RP13, RP14, RP15, RP2, RP3, RP4, RP5, RP6, RP7, RP8, RP9 } from './Multilink.js';

// constants
const DERIVED_PROPERTY_IO_PREFIX = 'DerivedPropertyIO';

type SelfOptions = {};

export type DerivedPropertyOptions<T> = SelfOptions & PropertyOptions<T>;

/**
 * Compute the derived value given a derivation and an array of dependencies
 */
function getDerivedValue<T>( derivation: ( ...x: any[] ) => T, dependencies: any ): T {

  return derivation( ...dependencies.map( ( property: any ) => property.get() ) );
}

export type UnknownDerivedProperty<T> = DerivedProperty<T, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>;

/**
 * T = type of the derived value
 * Parameters[] = types of the callback parameters, e.g. [ Vector2, number, boolean ]
 */
export default class DerivedProperty<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> extends ReadOnlyProperty<T> implements IReadOnlyProperty<T> {
  private dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> | null;
  private readonly derivation: any;
  private readonly derivedPropertyListener: () => void;
  public static DerivedPropertyIO: ( parameterType: any ) => any;

  /**
   * @param dependencies - Properties that this Property's value is derived from
   * @param derivation - function that derives this Property's value, expects args in the same order as dependencies
   * @param [providedOptions] - see Property
   */
  public constructor( dependencies: RP1<T1>, derivation: ( ...params: [ T1 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP2<T1, T2>, derivation: ( ...params: [ T1, T2 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP3<T1, T2, T3>, derivation: ( ...params: [ T1, T2, T3 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP4<T1, T2, T3, T4>, derivation: ( ...params: [ T1, T2, T3, T4 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP5<T1, T2, T3, T4, T5>, derivation: ( ...params: [ T1, T2, T3, T4, T5 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP6<T1, T2, T3, T4, T5, T6>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP7<T1, T2, T3, T4, T5, T6, T7>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP8<T1, T2, T3, T4, T5, T6, T7, T8>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP9<T1, T2, T3, T4, T5, T6, T7, T8, T9>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP13<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP14<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: RP15<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) ;
  public constructor( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T, providedOptions?: DerivedPropertyOptions<T> );
  public constructor( dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T, providedOptions?: DerivedPropertyOptions<T> ) {

    const options = optionize<DerivedPropertyOptions<T>, SelfOptions, PropertyOptions<T>>()( {
      tandem: Tandem.OPTIONAL,
      phetioReadOnly: true // derived properties can be read but not set by PhET-iO
    }, providedOptions );

    assert && options.tandem.supplied && assert( options.phetioType && options.phetioType.typeName.startsWith( DERIVED_PROPERTY_IO_PREFIX ),
      `phetioType must be provided and start with ${DERIVED_PROPERTY_IO_PREFIX}` );

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    const initialValue = getDerivedValue( derivation, dependencies );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    super( initialValue, options );

    if ( Tandem.VALIDATION && this.isPhetioInstrumented() ) {

      // The phetioType should be a concrete (instantiated) DerivedPropertyIO, hence we must check its outer type
      assert && assert( options.phetioType!.typeName.startsWith( 'DerivedPropertyIO' ), 'phetioType should be DerivedPropertyIO' );
    }

    this.dependencies = dependencies;
    this.derivation = derivation;
    this.derivedPropertyListener = this.getDerivedPropertyListener.bind( this );

    dependencies.forEach( dependency => {

      dependency.lazyLink( this.derivedPropertyListener );

      if ( dependency instanceof ReadOnlyProperty && this.isPhetioInstrumented() && dependency.isPhetioInstrumented() ) {

        // Dependencies should have taken their correct values before this DerivedProperty undefers, so it will be sure
        // to have the right value.
        // NOTE: Do not mark the beforePhase as NOTIFY, as this will potentially cause interdependence bugs when used
        // with Multilinks. See Projectile Motion's use of MeasuringTapeNode for an example.
        // @ts-ignore
        propertyStateHandlerSingleton.registerPhetioOrderDependency( dependency, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.UNDEFER );
      }
    } );
  }

  /**
   * Determines whether this DerivedProperty has a specific dependency.
   */
  public hasDependency( dependency: IReadOnlyProperty<IntentionalAny> ): boolean {
    return this.definedDependencies.includes( dependency );
  }

  /**
   * Returns dependencies that are guaranteed to be defined internally.
   */
  private get definedDependencies(): Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> {
    assert && assert( this.dependencies !== null, 'Dependencies should be defined, has this Property been disposed?' );
    return this.dependencies!;
  }

  /**
   * DerivedProperty cannot have their value set externally, so this returns false.
   */
  public override isSettable(): boolean {
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
      super.set( getDerivedValue( this.derivation, this.definedDependencies ) );
    }
  }

  /**
   * Allows forcing a recomputation (as a possible workaround to listener order).
   */
  public recomputeDerivation(): void {
    this.getDerivedPropertyListener();
  }

  public override dispose(): void {

    const dependencies = this.definedDependencies;

    // Unlink from dependent Properties
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];
      if ( dependency.hasListener( this.derivedPropertyListener ) ) {
        dependency.unlink( this.derivedPropertyListener );
      }
    }
    this.dependencies = null;

    super.dispose();
  }

  /**
   * Support deferred DerivedProperty by only calculating the derivation once when it is time to undefer it and fire
   * notifications. This way we don't have intermediate derivation calls during PhET-iO state setting.
   */
  public override setDeferred( isDeferred: boolean ): ( () => void ) | null {
    if ( this.isDeferred && !isDeferred ) {
      this.deferredValue = getDerivedValue( this.derivation, this.definedDependencies );
    }
    return super.setDeferred( isDeferred );
  }

  /**
   * Creates a derived boolean Property whose value is true iff firstProperty's value is equal to secondProperty's
   * value.
   */
  private static valueEquals<U, V>( firstProperty: IReadOnlyProperty<U>, secondProperty: IReadOnlyProperty<V>, options?: any ): IReadOnlyProperty<boolean> {
    return new DerivedProperty( [ firstProperty, secondProperty ], equalsFunction, options );
  }

  /**
   * Creates a derived boolean Property whose value is true iff every input Property value is true.
   */
  public static and( properties: IReadOnlyProperty<boolean>[], options?: PropertyOptions<boolean> ): UnknownDerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    // @ts-ignore
    return new DerivedProperty( properties, _.reduce.bind( null, properties, andFunction, true ), options );
  }

  /**
   * Creates a derived boolean Property whose value is true iff any input Property value is true.
   */
  public static or( properties: IReadOnlyProperty<boolean>[], options?: PropertyOptions<boolean> ): UnknownDerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    // @ts-ignore
    return new DerivedProperty( properties, _.reduce.bind( null, properties, orFunction, false ), options );
  }

  /**
   * Creates a derived boolean Property whose value is the inverse of the provided property.
   */
  public static not( propertyToInvert: IReadOnlyProperty<boolean>, options?: DerivedPropertyOptions<boolean> ): UnknownDerivedProperty<boolean> {
    return new DerivedProperty( [ propertyToInvert ], ( x: boolean ) => !x, options );
  }
}

const equalsFunction = ( a: any, b: any ): boolean => {
  return a === b;
};

const andFunction = ( value: boolean, property: IReadOnlyProperty<boolean> ) => {
  return value && property.value;
};

const orFunction = ( value: boolean, property: IReadOnlyProperty<boolean> ) => {
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


// Convenience classes for subclassing DerivedProperty
export class DerivedProperty1<T, T1> extends DerivedProperty<T, T1, never, never, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty2<T, T1, T2> extends DerivedProperty<T, T1, T2, never, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty3<T, T1, T2, T3> extends DerivedProperty<T, T1, T2, T3, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty4<T, T1, T2, T3, T4> extends DerivedProperty<T, T1, T2, T3, T4, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty5<T, T1, T2, T3, T4, T5> extends DerivedProperty<T, T1, T2, T3, T4, T5, never, never, never, never, never, never, never, never, never, never> {}

axon.register( 'DerivedProperty', DerivedProperty );
