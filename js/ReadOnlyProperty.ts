// Copyright 2013-2025, University of Colorado Boulder
/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import type StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';
import isClearingPhetioDynamicElementsProperty from '../../tandem/js/isClearingPhetioDynamicElementsProperty.js';
import isPhetioStateEngineManagingPropertyValuesProperty from '../../tandem/js/isPhetioStateEngineManagingPropertyValuesProperty.js';
import PhetioObject, { type PhetioObjectOptions } from '../../tandem/js/PhetioObject.js';
import Tandem, { DYNAMIC_ARCHETYPE_NAME } from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType, { AnyIOType } from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import { type DisposerOptions } from './Disposable.js';
import { propertyStateHandlerSingleton } from './PropertyStateHandler.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import { type TinyEmitterOptions } from './TinyEmitter.js';
import TinyProperty from './TinyProperty.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';
import { type PropertyLazyLinkListener, type PropertyLinkListener, type PropertyListener } from './TReadOnlyProperty.js';
import units, { type Units } from './units.js';
import validate from './validate.js';
import Validation, { type Validator, type ValueComparisonStrategy } from './Validation.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// variables
let globalId = 0; // auto-incremented for unique IDs

type AnyPropertyIOType = IOType<ReadOnlyProperty<IntentionalAny>, ReadOnlyPropertyState<IntentionalAny>>;

// Cache each parameterized PropertyIO based on the parameter type, so that it is only created once
const cache = new IOTypeCache<AnyPropertyIOType>();

export type ReadOnlyPropertyState<StateType> = {
  value: StateType;

  // Only include validValues if specified, so they only show up in PhET-iO Studio when supplied.
  validValues: StateType[] | null;

  units: string | null;
};

// Options defined by Property
type SelfOptions = {

  // units for the value, see units.js. Should prefer abbreviated units, see https://github.com/phetsims/phet-io/issues/530
  units?: Units | null;

  // Whether reentrant calls to 'set' are allowed.
  // Use this to detect or prevent update cycles. Update cycles may be due to floating point error,
  // faulty logic, etc. This may be of particular interest for PhET-iO instrumentation, where such
  // cycles may pollute the data stream. See https://github.com/phetsims/axon/issues/179
  reentrant?: boolean;

  // The IOType for the values this Property supports. At this level, it doesn't matter what the state type is, so
  // it defaults to IntentionalAny.
  phetioValueType?: AnyIOType;

  // The IOType function that returns a parameterized IOType based on the valueType. There is a general default, but
  // subtypes can implement their own, more specific IOType.
  phetioOuterType?: ( parameterType: AnyIOType ) => AnyIOType;

  // If specified as true, this flag will ensure that listener order never changes (like via ?listenerOrder=random)
  hasListenerOrderDependencies?: boolean;

  // Changes the behavior of how listeners are notified in reentrant cases (where linked listeners cause this Property
  // to change its value again). Defaults to "queue" for Properties so that we notify all listeners for a value change
  // before notifying for the next value change. For example, if we change from a->b, and one listener changes the value
  // from b->c, that reentrant value change will queue its listeners for after all listeners have fired for a->b. For
  // specifics see documentation in TinyEmitter.
} & Pick<TinyEmitterOptions, 'reentrantNotificationStrategy'>;

type ParentOptions<T> = Validator<T> & PhetioObjectOptions;

// Options that can be passed in
export type PropertyOptions<T> = SelfOptions & StrictOmit<ParentOptions<T>, 'phetioType'>;

export type LinkOptions = {
  phetioDependencies?: Array<TReadOnlyProperty<unknown>>;
};

// If provided, will be unlinked when the disposable is disposed
type ReadOnlyPropertyLinkOptions = LinkOptions & DisposerOptions;

/**
 * Base class for Property, DerivedProperty, DynamicProperty.  Set methods are protected/not part of the public
 * interface.  Initial value and resetting is not defined here.
 */
export default class ReadOnlyProperty<T> extends PhetioObject implements TReadOnlyProperty<T> {

  // Unique identifier for this Property.
  private readonly id: number;

  // (phet-io) Units, if any.  See units.js for valid values
  public readonly units: Units | null;

  public readonly validValues?: readonly T[];

  // emit is called when the value changes (or on link)
  private tinyProperty: TinyProperty<T>;

  // whether we are in the process of notifying listeners; changed in some Property test files with @ts-expect-error
  private notifying: boolean;

  // whether to allow reentry of calls to set
  private readonly reentrant: boolean;

  // while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
  // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
  // send notifications.
  public isDeferred: boolean;

  // the value that this Property will take after no longer deferred
  protected deferredValue: T | null;

  // whether a deferred value has been set
  protected hasDeferredValue: boolean;

  protected readonly valueValidator: Validator<T>;

  // The IOType for the values this Property supports.
  protected readonly phetioValueType: IOType<T, IntentionalAny>;


  /**
   * This is protected to indicate to clients that subclasses should be used instead.
   * @param value - the initial value of the property
   * @param [providedOptions]
   */
  protected constructor( value: T, providedOptions?: PropertyOptions<T> ) {
    const options = optionize<PropertyOptions<T>, SelfOptions, ParentOptions<T>>()( {
      units: null,
      reentrant: false,
      hasListenerOrderDependencies: false,
      reentrantNotificationStrategy: 'queue',

      // See Validation.ts for ValueComparisonStrategy for available values. Please note that this will be used for
      // equality comparison both with validation (i.e. for validValue comparison), as well as determining if the
      // value has changed such that listeners should fire, see TinyProperty.areValuesEqual().
      valueComparisonStrategy: 'reference',

      // phet-io
      tandemNameSuffix: [ 'Property', DYNAMIC_ARCHETYPE_NAME ], // DYNAMIC_ARCHETYPE_NAME means that this Property is an archetype.
      phetioOuterType: ReadOnlyProperty.PropertyIO,
      phetioValueType: IOType.ObjectIO
    }, providedOptions );


    assert && options.units && assert( units.isValidUnits( options.units ), `invalid units: ${options.units}` );
    if ( options.units ) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};
      assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'units' ), 'units should be supplied by Property, not elsewhere' );
      options.phetioEventMetadata.units = options.units;
    }

    if ( assert && providedOptions ) {

      // @ts-expect-error -- for checking JS code
      assert && assert( !providedOptions.phetioType, 'Set phetioType via phetioValueType' );
    }

    // Construct the IOType
    if ( options.phetioOuterType && options.phetioValueType ) {
      options.phetioType = options.phetioOuterType( options.phetioValueType );
    }

    // Support non-validated Property
    if ( !Validation.containsValidatorKey( options ) ) {
      options.isValidValue = () => true;
    }
    super( options );
    this.id = globalId++;
    this.units = options.units;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    if ( this.isPhetioInstrumented() ) {

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && Tandem.VALIDATION && assert( this.phetioType,
        `phetioType passed to Property must be specified. Tandem.phetioID: ${this.tandem.phetioID}` );

      assert && Tandem.VALIDATION && assert( options.phetioType.parameterTypes![ 0 ],
        `phetioType parameter type must be specified (only one). Tandem.phetioID: ${this.tandem.phetioID}` );

      assert && assert( options.phetioValueType !== IOType.ObjectIO,
        'PhET-iO Properties must specify a phetioValueType: ' + this.phetioID );
    }

    this.validValues = options.validValues;

    this.tinyProperty = new TinyProperty( value, null, options.hasListenerOrderDependencies, options.reentrantNotificationStrategy );

    // Since we are already in the heavyweight Property, we always assign TinyProperty.valueComparisonStrategy for clarity.
    this.tinyProperty.valueComparisonStrategy = options.valueComparisonStrategy;
    this.notifying = false;
    this.reentrant = options.reentrant;
    this.isDeferred = false;
    this.deferredValue = null;
    this.hasDeferredValue = false;
    this.phetioValueType = options.phetioValueType;

    this.valueValidator = _.pick( options, Validation.VALIDATOR_KEYS );
    this.valueValidator.validationMessage = this.valueValidator.validationMessage || 'Property value not valid';

    if ( this.valueValidator.phetioType ) {

      // Validate the value type's phetioType of the Property, not the PropertyIO itself.
      // For example, for PropertyIO( BooleanIO ), assign this valueValidator's phetioType to be BooleanIO's validator.
      assert && assert( !!this.valueValidator.phetioType.parameterTypes![ 0 ], 'unexpected number of parameters for Property' );

      // This is the validator for the value, not for the Property itself
      this.valueValidator.phetioType = this.valueValidator.phetioType.parameterTypes![ 0 ];
    }

    // Assertions regarding value validation
    if ( assert ) {

      Validation.validateValidator( this.valueValidator );

      // validate the initial value as well as any changes in the future
      validate( value, this.valueValidator, VALIDATE_OPTIONS_FALSE );
    }
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   */
  public isSettable(): boolean {
    return false;
  }

  /**
   * Gets the value.
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   */
  public get(): T {
    return this.tinyProperty.get();
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * NOTE: For PhET-iO instrumented Properties that are phetioState: true, the value is only
   * set by the PhetioStateEngine and cannot be modified by other code while isSettingPhetioStateProperty === true.
   */
  protected set( value: T ): void {

    // State is managed by the PhetioStateEngine, see https://github.com/phetsims/axon/issues/409
    const setManagedByPhetioState = isPhetioStateEngineManagingPropertyValuesProperty.value &&

                                    // We still want to set Properties when clearing dynamic elements, see https://github.com/phetsims/phet-io/issues/1906
                                    !isClearingPhetioDynamicElementsProperty.value &&
                                    this.isPhetioInstrumented() && this.phetioState &&

                                    // However, DerivedProperty should be able to update during PhET-iO state set
                                    this.isSettable();

    if ( !setManagedByPhetioState ) {
      this.unguardedSet( value );
    }
    else {
      // Uncomment while implementing PhET-iO State for your simulation to see what value-setting is being silently ignored.
      // console.warn( `Ignoring attempt to ReadOnlyProperty.set(): ${this.phetioID}` );
    }
  }

  /**
   * For usage by the IOType during PhET-iO state setting.
   */
  protected unguardedSet( value: T ): void {
    if ( !this.isDisposed ) {
      if ( this.isDeferred ) {
        this.deferredValue = value;
        this.hasDeferredValue = true;
      }
      else if ( !this.equalsValue( value ) ) {
        const oldValue = this.get();
        this.setPropertyValue( value );
        this._notifyListeners( oldValue );
      }
    }
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   */
  protected setPropertyValue( value: T ): void {
    this.tinyProperty.setPropertyValue( value );
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   */
  protected equalsValue( value: T ): boolean {

    // Ideally, we would call the equalsValue in tinyProperty, but it is protected. Furthermore, it is nice to get
    // the assertions associated with ReadOnlyProperty.get().
    return this.areValuesEqual( value, this.get() );
  }

  /**
   * Determine if the two values are equal, see TinyProperty.areValuesEqual().
   */
  public areValuesEqual( a: T, b: T ): boolean {
    return this.tinyProperty.areValuesEqual( a, b );
  }

  /**
   * NOTE: a few sims are calling this even though they shouldn't
   */
  private _notifyListeners( oldValue: T | null ): void {
    const newValue = this.get();

    // validate the before notifying listeners
    assert && validate( newValue, this.valueValidator, VALIDATE_OPTIONS_FALSE );

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent( ReadOnlyProperty.CHANGED_EVENT_NAME, {
      getData: () => {
        const parameterType = this.phetioType.parameterTypes![ 0 ];
        return {
          oldValue: NullableIO( parameterType ).toStateObject( oldValue ),
          newValue: parameterType.toStateObject( newValue )
        };
      }
    } );

    // notify listeners, optionally detect loops where this Property is set again before this completes.
    assert && assert( !this.notifying || this.reentrant,
      `reentry detected, value=${newValue}, oldValue=${oldValue}` );
    this.notifying = true;

    this.tinyProperty.emit( newValue, oldValue, this ); // cannot use tinyProperty.notifyListeners because it uses the wrong this
    this.notifying = false;

    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  /**
   * Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
   * This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
   * This method is unsafe for removing listeners because it assumes the listener list not modified, to save another allocation
   * Only provides the new reference as a callback (no oldValue)
   * See https://github.com/phetsims/axon/issues/6
   */
  public notifyListenersStatic(): void {
    this._notifyListeners( null );
  }

  /**
   * When deferred, set values do not take effect or send out notifications.  After defer ends, the Property takes
   * its deferred value (if any), and a follow-up action (return value) can be invoked to send out notifications
   * once other Properties have also taken their deferred values.
   *
   * @param isDeferred - whether the Property should be deferred or not
   * @returns - function to notify listeners after calling setDeferred(false),
   *          - null if isDeferred is true, or if the value is unchanged since calling setDeferred(true)
   */
  public setDeferred( isDeferred: boolean ): ( () => void ) | null {
    assert && assert( !this.isDisposed, 'cannot defer Property if already disposed.' );
    if ( isDeferred ) {
      assert && assert( !this.isDeferred, 'Property already deferred' );
      this.isDeferred = true;
    }
    else {
      assert && assert( this.isDeferred, 'Property wasn\'t deferred' );
      this.isDeferred = false;

      const oldValue = this.get();

      // Take the new value
      if ( this.hasDeferredValue ) {
        this.setPropertyValue( this.deferredValue! );
        this.hasDeferredValue = false;
        this.deferredValue = null;
      }

      // If the value has changed, prepare to send out notifications (after all other Properties in this transaction
      // have their final values)
      if ( !this.equalsValue( oldValue ) ) {
        return () => !this.isDisposed && this._notifyListeners( oldValue );
      }
    }

    // no action to signify change
    return null;
  }

  public get value(): T {
    return this.get();
  }

  protected set value( newValue: T ) {
    this.set( newValue );
  }

  /**
   * This function registers an order dependency between this Property and another. Basically this says that when
   * setting PhET-iO state, each dependency must take its final value before this Property fires its notifications.
   * See propertyStateHandlerSingleton.registerPhetioOrderDependency and https://github.com/phetsims/axon/issues/276 for more info.
   */
  public addPhetioStateDependencies( dependencies: Array<TReadOnlyProperty<IntentionalAny>> ): void {
    assert && assert( Array.isArray( dependencies ), 'Array expected' );
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependencyProperty = dependencies[ i ];

      // only if running in PhET-iO brand and both Properties are instrumenting
      if ( dependencyProperty instanceof ReadOnlyProperty && dependencyProperty.isPhetioInstrumented() && this.isPhetioInstrumented() ) {

        // The dependency should undefer (taking deferred value) before this Property notifies.
        propertyStateHandlerSingleton.registerPhetioOrderDependency(
          dependencyProperty, PropertyStatePhase.UNDEFER,
          this, PropertyStatePhase.NOTIFY
        );
      }
    }
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   *
   * @param listener - a function that takes a new value, old value, and this Property as arguments
   * @param [options]
   */
  public link( listener: PropertyLinkListener<T>, options?: ReadOnlyPropertyLinkOptions ): void {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }

    this.tinyProperty.addListener( listener ); // cannot use tinyProperty.link() because of wrong this

    this.addPropertyDisposerAction( listener, options );

    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add a listener to the Property, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   */
  public lazyLink( listener: PropertyLazyLinkListener<T>, options?: ReadOnlyPropertyLinkOptions ): void {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }
    this.tinyProperty.lazyLink( listener ); // Note: do not pass through the disposer options

    this.addPropertyDisposerAction( listener, options );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   */
  public unlink( listener: PropertyListener<T> ): void {
    this.tinyProperty.unlink( listener );

    // undo addDisposer (see above)
    this.removeDisposerAction( 'link', listener );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   */
  public unlinkAll(): void {
    this.tinyProperty.unlinkAll();

    // undo addDisposer (see above)
    this.removeAllDisposerActions( 'link' );
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * NOTE: Duplicated with TinyProperty.linkAttribute
   */
  public linkAttribute( object: IntentionalAny, attributeName: string ): ( value: T ) => void {
    const handle = ( value: T ) => { object[ attributeName ] = value; };
    this.link( handle );
    return handle;
  }

  /**
   * Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
   */
  public override toString(): string {
    return `Property#${this.id}{${this.get()}}`;
  }

  /**
   * Convenience function for debugging a Property's value. It prints the new value on registration and when changed.
   * @param name - debug name to be printed on the console
   * @returns - the handle to the linked listener in case it needs to be removed later
   */
  public debug( name: string ): ( value: T ) => void {
    const listener = ( value: T ) => console.log( name, value );
    this.link( listener );
    return listener;
  }

  public isValueValid( value: T ): boolean {
    return this.getValidationError( value ) === null;
  }

  public getValidationError( value: T ): string | null {
    return Validation.getValidationError( value, this.valueValidator, VALIDATE_OPTIONS_FALSE );
  }

  // If a disposer is specified, then automatically remove this listener when the disposer is disposed.
  private addPropertyDisposerAction( listener: PropertyListener<T>, options?: DisposerOptions ): void {
    options?.disposer && this.addDisposerAction( 'link', listener, options.disposer, () => this.unlink( listener ) );
  }

  // Ensures that the Property is eligible for GC
  public override dispose(): void {

    // unregister any order dependencies for this Property for PhET-iO state
    if ( this.isPhetioInstrumented() ) {
      propertyStateHandlerSingleton.unregisterOrderDependenciesForProperty( this );
    }

    super.dispose();
    this.tinyProperty.dispose();
  }

  /**
   * Checks whether a listener is registered with this Property
   */
  public hasListener( listener: PropertyLinkListener<T> ): boolean {
    return this.tinyProperty.hasListener( listener );
  }

  /**
   * Returns the number of listeners.
   */
  private getListenerCount(): number {
    return this.tinyProperty.getListenerCount();
  }

  /**
   * Invokes a callback once for each listener
   * @param callback - takes the listener as an argument
   */
  public forEachListener( callback: ( value: ( ...args: [ T, T | null, TinyProperty<T> | ReadOnlyProperty<T> ] ) => void ) => void ): void {
    this.tinyProperty.forEachListener( callback );
  }

  /**
   * Returns true if there are any listeners.
   */
  public hasListeners(): boolean {
    assert && assert( arguments.length === 0, 'Property.hasListeners should be called without arguments' );
    return this.tinyProperty.hasListeners();
  }

  public get valueComparisonStrategy(): ValueComparisonStrategy<T> {
    return this.tinyProperty.valueComparisonStrategy;
  }

  public set valueComparisonStrategy( valueComparisonStrategy: ValueComparisonStrategy<T> ) {
    this.tinyProperty.valueComparisonStrategy = valueComparisonStrategy;
  }

  /**
   * Implementation of serialization for PhET-iO support. Override this function to customize how this state
   * behaves (but be careful!).
   *
   * This function is parameterized to support subtyping. That said, it is a bit useless, since we don't want to
   * parameterize ReadOnlyProperty in general to the IOType's state type, so please bear with us.
   */
  protected toStateObject<StateType>(): ReadOnlyPropertyState<StateType> {
    assert && assert( this.phetioValueType.toStateObject, `toStateObject doesn't exist for ${this.phetioValueType.typeName}` );
    return {
      value: this.phetioValueType.toStateObject( this.value ),
      validValues: NullableIO( ArrayIO( this.phetioValueType ) ).toStateObject( this.validValues === undefined ? null : this.validValues as T[] ),
      units: NullableIO( StringIO ).toStateObject( this.units )
    };
  }

  /**
   * Implementation of serialization for PhET-iO support. Override this function to customize how this state
   * behaves (but be careful!).
   */
  protected applyState<StateType>( stateObject: ReadOnlyPropertyState<StateType> ): void {
    const units = NullableIO( StringIO ).fromStateObject( stateObject.units );
    assert && assert( this.units === units, 'Property units do not match' );
    assert && assert( this.isSettable(), 'Property should be settable' );
    this.unguardedSet( this.phetioValueType.fromStateObject( stateObject.value ) );
  }

  /**
   * An observable Property that triggers notifications when the value changes.
   * This caching implementation should be kept in sync with the other parametric IOType caching implementations.
   */
  public static PropertyIO<ParameterType, ParameterStateType>(
    parameterType: IOType<ParameterType, ParameterStateType>
  ): IOType<ReadOnlyProperty<ParameterType>, ReadOnlyPropertyState<ParameterStateType>> {
    assert && assert( parameterType, 'PropertyIO needs parameterType' );

    if ( !cache.has( parameterType ) ) {
      cache.set( parameterType, new IOType<ReadOnlyProperty<ParameterType>, ReadOnlyPropertyState<ParameterStateType>>( `PropertyIO<${parameterType.typeName}>`, {

        // We want PropertyIO to work for DynamicProperty and DerivedProperty, but they extend ReadOnlyProperty
        valueType: ReadOnlyProperty,
        documentation: 'Observable values that send out notifications when the value changes. This differs from the ' +
                       'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                       'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
        methodOrder: [ 'link', 'lazyLink' ],
        events: [ ReadOnlyProperty.CHANGED_EVENT_NAME ],
        parameterTypes: [ parameterType ],
        toStateObject: property => {
          return property.toStateObject();
        },
        applyState: ( property, stateObject ) => {
          property.applyState( stateObject );
        },
        stateSchema: {
          value: parameterType,
          validValues: NullableIO( ArrayIO( parameterType ) ),
          units: NullableIO( StringIO )
        },
        apiStateKeys: [ 'validValues', 'units' ],
        methods: {
          getValue: {
            returnType: parameterType,
            parameterTypes: [],
            implementation: ReadOnlyProperty.prototype.get,
            documentation: 'Gets the current value.'
          },
          getValidationError: {
            returnType: NullableIO( StringIO ),
            parameterTypes: [ parameterType ],
            implementation: function( this: ReadOnlyProperty<unknown>, value: ParameterType ) {
              return this.getValidationError( value );
            },
            documentation: 'Checks to see if a proposed value is valid. Returns the first validation error, or null if the value is valid.'
          },

          setValue: {
            returnType: VoidIO,
            parameterTypes: [ parameterType ],
            implementation: function( this: ReadOnlyProperty<unknown>, value: ParameterType ) {
              this.set( value );
            },
            documentation: 'Sets the value of the Property. If the value differs from the previous value, listeners are ' +
                           'notified with the new value.',
            invocableForReadOnlyElements: false
          },

          link: {
            returnType: VoidIO,

            // oldValue will start as "null" the first time called
            parameterTypes: [ FunctionIO( VoidIO, [ parameterType, NullableIO( parameterType ) ] ) ],
            implementation: ReadOnlyProperty.prototype.link,
            documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is ' +
                           'also called with the current value. The listener takes two arguments, the new value and the ' +
                           'previous value.'
          },

          lazyLink: {
            returnType: VoidIO,

            // oldValue will start as "null" the first time called
            parameterTypes: [ FunctionIO( VoidIO, [ parameterType, NullableIO( parameterType ) ] ) ],
            implementation: ReadOnlyProperty.prototype.lazyLink,
            documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' +
                           'without the current-value callback on registration. The listener takes two arguments, the new ' +
                           'value and the previous value.'
          },
          unlink: {
            returnType: VoidIO,
            parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
            implementation: ReadOnlyProperty.prototype.unlink,
            documentation: 'Removes a listener.'
          }
        },
        fuzzElement: ( element, shouldLog ) => {
          if ( element.phetioType.parameterTypes?.length === 1 &&
               element.phetioType.parameterTypes[ 0 ] === BooleanIO && // We want this more general than in BooleanProperty
               element.isSettable() ) {

            const oldValue = element.value;
            const newValue = !oldValue;
            shouldLog && console.log( `${element.phetioID}:`, oldValue, '->', newValue );

            // @ts-expect-error
            element.value = newValue;
          }
        }
      } ) );
    }

    return cache.get( parameterType )!;
  }

  /**
   * Support treating ourselves as an autoselectable entity for the "strings" selection mode.
   */
  public override getPhetioMouseHitTarget( fromLinking = false ): PhetioObject | 'phetioNotSelectable' {

    if ( phet.tandem.phetioElementSelectionProperty.value === 'string' ) {

      // As of this writing, the only way to get to this function is for Properties that have a value of strings, but
      // in the future that may not be the case. SR and MK still think it is preferable to keep this general, as false
      // positives for autoselect are generally better than false negatives.
      return this.getPhetioMouseHitTargetSelf();
    }

    return super.getPhetioMouseHitTarget( fromLinking );
  }


  public static readonly CHANGED_EVENT_NAME = 'changed';
}

axon.register( 'ReadOnlyProperty', ReadOnlyProperty );