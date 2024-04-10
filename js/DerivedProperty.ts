// Copyright 2013-2024, University of Colorado Boulder

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
import Property, { PropertyOptions } from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import optionize from '../../phet-core/js/optionize.js';
import { Dependencies, RP1, RP10, RP11, RP12, RP13, RP14, RP15, RP2, RP3, RP4, RP5, RP6, RP7, RP8, RP9 } from './Multilink.js';
import ReadOnlyProperty, { derivationStack } from './ReadOnlyProperty.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';

const DERIVED_PROPERTY_IO_PREFIX = 'DerivedPropertyIO';

type SelfOptions = {

  // When true, if this DerivedProperty is PhET-iO instrument, add a LinkedElement for each PhET-iO instrumented dependency.
  phetioLinkDependencies?: boolean;

  // Typically, a DerivedProperty should only get values for its immediate dependencies, otherwise it could end up in a
  // situation where some value central to the derivation has changed, but the derived property doesn't update because
  // it isn't listening. These checks can be enabled via a package.json flag simFeatures.strictAxonDependencies or
  // the query parameter ?strictAxonDependencies=true. The query parameter takes precedence.
  // See https://github.com/phetsims/axon/issues/441
  strictAxonDependencies?: boolean;
};

export type DerivedPropertyOptions<T> = SelfOptions & PropertyOptions<T>;

const strictAxonDependenciesGlobal = _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.strictAxonDependencies;

/**
 * Compute the derived value given a derivation and an array of dependencies
 */
function getDerivedValue<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>( strictAxonDependencies: boolean, derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T, dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> ): T {

  assert && strictAxonDependenciesGlobal && strictAxonDependencies && derivationStack.push( dependencies );

  try {

    // @ts-expect-error
    return derivation( ...dependencies.map( property => property.get() ) );
  }
  finally {
    assert && strictAxonDependenciesGlobal && strictAxonDependencies && derivationStack.pop();
  }
}

// Convenience type for a Derived property that has a known return type but unknown dependency types.
export type UnknownDerivedProperty<T> = DerivedProperty<T, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>;

/**
 * T = type of the derived value
 * Parameters[] = types of the callback parameters, e.g. [ Vector2, number, boolean ]
 */
export default class DerivedProperty<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> extends ReadOnlyProperty<T> implements TReadOnlyProperty<T> {
  private dependencies: Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> | null;
  private readonly derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T;
  private readonly derivedPropertyListener: () => void;
  private readonly strictAxonDependencies: boolean;

  public static DerivedPropertyIO: ( parameterType: IOType ) => IOType;

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
      phetioReadOnly: true, // derived properties can be read but not set by PhET-iO
      phetioOuterType: DerivedProperty.DerivedPropertyIO,
      phetioLinkDependencies: true,
      strictAxonDependencies: true
    }, providedOptions );

    assert && assert( dependencies.every( _.identity ), 'dependencies should all be truthy' );
    assert && assert( dependencies.length === _.uniq( dependencies ).length, 'duplicate dependencies' );

    const initialValue = getDerivedValue( options.strictAxonDependencies, derivation, dependencies );

    // We must pass supertype tandem to parent class so addInstance is called only once in the subclassiest constructor.
    super( initialValue, options );

    if ( Tandem.VALIDATION && this.isPhetioInstrumented() ) {

      // The phetioType should be a concrete (instantiated) DerivedPropertyIO, hence we must check its outer type
      assert && assert( this.phetioType.typeName.startsWith( 'DerivedPropertyIO' ), 'phetioType should be DerivedPropertyIO' );
    }

    this.dependencies = dependencies;
    this.derivation = derivation;
    this.strictAxonDependencies = options.strictAxonDependencies;
    this.derivedPropertyListener = this.getDerivedPropertyListener.bind( this );

    dependencies.forEach( dependency => {

      dependency.lazyLink( this.derivedPropertyListener );

      if ( Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && dependency instanceof PhetioObject && dependency.isPhetioInstrumented() ) {
        if ( dependency instanceof ReadOnlyProperty ) {

          // Dependencies should have taken their correct values before this DerivedProperty undefers, so it will be sure
          // to have the right value.
          // NOTE: Do not mark the beforePhase as NOTIFY, as this will potentially cause interdependence bugs when used
          // with Multilinks. See Projectile Motion's use of MeasuringTapeNode for an example.
          propertyStateHandlerSingleton.registerPhetioOrderDependency( dependency, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.UNDEFER );
        }

        if ( options.tandem && options.phetioLinkDependencies ) {
          const dependenciesTandem = options.tandem.createTandem( 'dependencies' );
          this.addLinkedElement( dependency, {
            tandem: dependenciesTandem.createTandemFromPhetioID( dependency.tandem.phetioID )
          } );
        }
      }
    } );
  }

  /**
   * Determines whether this DerivedProperty has a specific dependency.
   */
  public hasDependency( dependency: TReadOnlyProperty<IntentionalAny> ): boolean {
    return this.definedDependencies.includes( dependency );
  }

  /**
   * Returns dependencies that are guaranteed to be defined internally.
   */
  private get definedDependencies(): Dependencies<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> {
    assert && assert( this.dependencies !== null, 'Dependencies should be defined, has this Property been disposed?' );
    return this.dependencies!;
  }

  // for bind
  private getDerivedPropertyListener(): void {
    // Don't try to recompute if we are disposed, see https://github.com/phetsims/axon/issues/432
    if ( this.isDisposed ) {
      return;
    }

    // Just mark that there is a deferred value, then calculate the derivation below when setDeferred() is called.
    // This is in part supported by the PhET-iO state engine because it can account for intermediate states, such
    // that this Property won't notify until after it is undeferred and has taken its final value.
    if ( this.isDeferred ) {
      this.hasDeferredValue = true;
    }
    else {
      super.set( getDerivedValue( this.strictAxonDependencies, this.derivation, this.definedDependencies ) );
    }
  }

  /**
   * Allows forcing a recomputation (as a possible workaround to listener order). This works well if you have a
   * non-Property event that should trigger a value change for this Property.
   *
   * For example:
   * myEmitter.addListener( () => myDerivedProperty.recomputeDerivation() );
   * myObservableArray.addItemAddedListener( () => myDerivedProperty.recomputeDerivation() );
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
      this.deferredValue = getDerivedValue( this.strictAxonDependencies, this.derivation, this.definedDependencies );
    }
    return super.setDeferred( isDeferred );
  }

  /**
   * Creates a derived boolean Property whose value is true iff firstProperty's value is equal to secondProperty's
   * value.
   */
  public static valueEquals( firstProperty: TReadOnlyProperty<unknown>, secondProperty: TReadOnlyProperty<unknown>, options?: DerivedPropertyOptions<boolean> ): TReadOnlyProperty<boolean> {
    return new DerivedProperty( [ firstProperty, secondProperty ], ( u: unknown, v: unknown ) => u === v, options );
  }

  public static valueEqualsConstant( firstProperty: TReadOnlyProperty<unknown>, value: unknown, options?: DerivedPropertyOptions<boolean> ): TReadOnlyProperty<boolean> {
    return new DerivedProperty( [ firstProperty ], ( u: unknown ) => u === value, options );
  }

  /**
   * Creates a derived boolean Property whose value is true iff every input Property value is true.
   */
  public static and( properties: TReadOnlyProperty<boolean>[], options?: PropertyOptions<boolean> ): UnknownDerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    return DerivedProperty.deriveAny( properties, () => _.reduce( properties, andFunction, true ), options );
  }

  /**
   * Creates a derived boolean Property whose value is true iff any input Property value is true.
   */
  public static or( properties: TReadOnlyProperty<boolean>[], options?: PropertyOptions<boolean> ): UnknownDerivedProperty<boolean> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    return DerivedProperty.deriveAny( properties, () => _.reduce( properties, orFunction, false ), options );
  }

  /**
   * Creates a derived number Property whose value is the result of multiplying all (number) dependencies together.
   */
  public static multiply( properties: TReadOnlyProperty<number>[], options?: PropertyOptions<number> ): UnknownDerivedProperty<number> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    return DerivedProperty.deriveAny( properties, () => _.reduce( properties, multiplyFunction, 1 ), options );
  }

  /**
   * Creates a derived number Property whose value is the result of adding all (number) dependencies together.
   */
  public static add( properties: TReadOnlyProperty<number>[], options?: PropertyOptions<number> ): UnknownDerivedProperty<number> {
    assert && assert( properties.length > 0, 'must provide a dependency' );

    return DerivedProperty.deriveAny( properties, () => _.reduce( properties, addFunction, 0 ), options );
  }

  /**
   * Creates a derived boolean Property whose value is the inverse of the provided property.
   */
  public static not( propertyToInvert: TReadOnlyProperty<boolean>, options?: DerivedPropertyOptions<boolean> ): DerivedProperty<boolean, boolean, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown> {
    return new DerivedProperty( [ propertyToInvert ], ( x: boolean ) => !x, options );
  }

  /**
   * Create a DerivedProperty from any number of dependencies.  This is parallel to Multilink.multilinkAny
   */
  public static deriveAny<T>( dependencies: Array<TReadOnlyProperty<unknown>>, derivation: () => T, providedOptions?: DerivedPropertyOptions<T> ): UnknownDerivedProperty<T> {
    return new DerivedProperty(
      // @ts-expect-error we have to provide a mapping between an arbitrary length array and our max overload of 15 types.
      dependencies,

      derivation, providedOptions );
  }
}

const andFunction = ( value: boolean, property: TReadOnlyProperty<boolean> ): boolean => {
  return value && property.value;
};

const orFunction = ( value: boolean, property: TReadOnlyProperty<boolean> ): boolean => {
  assert && assert( typeof property.value === 'boolean', 'boolean value required' );
  return value || property.value;
};

const multiplyFunction = ( value: number, property: TReadOnlyProperty<number> ): number => {
  assert && assert( typeof property.value === 'number', 'number value required' );
  return value * property.value;
};

const addFunction = ( value: number, property: TReadOnlyProperty<number> ): number => {
  assert && assert( typeof property.value === 'number', 'number value required' );
  return value + property.value;
};

// Cache each parameterized DerivedPropertyIO so that it is only created once.
const cache = new IOTypeCache();

/**
 * Parametric IOType constructor.  Given a parameter type, this function returns an appropriate DerivedProperty
 * IOType. Unlike PropertyIO, DerivedPropertyIO cannot be set by PhET-iO clients.
 * This caching implementation should be kept in sync with the other parametric IOType caching implementations.
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
      applyState: _.noop,
      methods: {
        setValue: {
          returnType: VoidIO,
          parameterTypes: [ parameterType ],

          // @ts-expect-error
          implementation: DerivedProperty.prototype.set,
          documentation: 'Errors out when you try to set a derived property.',
          invocableForReadOnlyElements: false
        }
      }
    } ) );
  }

  return cache.get( parameterType )!;
};


// Convenience classes for subclassing DerivedProperty
export class DerivedProperty1<T, T1> extends DerivedProperty<T, T1, never, never, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty2<T, T1, T2> extends DerivedProperty<T, T1, T2, never, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty3<T, T1, T2, T3> extends DerivedProperty<T, T1, T2, T3, never, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty4<T, T1, T2, T3, T4> extends DerivedProperty<T, T1, T2, T3, T4, never, never, never, never, never, never, never, never, never, never, never> {}

export class DerivedProperty5<T, T1, T2, T3, T4, T5> extends DerivedProperty<T, T1, T2, T3, T4, T5, never, never, never, never, never, never, never, never, never, never> {}

axon.register( 'DerivedProperty', DerivedProperty );