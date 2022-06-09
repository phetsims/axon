// Copyright 2013-2022, University of Colorado Boulder
/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import PhetioObject, { PhetioObjectOptions } from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import TinyProperty from './TinyProperty.js';
import units from './units.js';
import validate from './validate.js';
import IReadOnlyProperty, { PropertyLazyLinkListener, PropertyLinkListener, PropertyListener } from './IReadOnlyProperty.js';
import optionize from '../../phet-core/js/optionize.js';
import Validation, { Validator } from './Validation.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// variables
let globalId = 0; // auto-incremented for unique IDs

// Options defined by Property
type SelfOptions = {

  // useDeepEquality: true => Use the `equals` method on the values
  // useDeepEquality: false => Use === for equality test
  useDeepEquality?: boolean;

  // units for the number, see units.js. Should prefer abbreviated units, see https://github.com/phetsims/phet-io/issues/530
  units?: string | null;

  // Whether reentrant calls to 'set' are allowed.
  // Use this to detect or prevent update cycles. Update cycles may be due to floating point error,
  // faulty logic, etc. This may be of particular interest for PhET-iO instrumentation, where such
  // cycles may pollute the data stream. See https://github.com/phetsims/axon/issues/179
  reentrant?: boolean;
};

// Options that can be passed in
export type PropertyOptions<T> = SelfOptions & Validator<T> & PhetioObjectOptions;

/**
 * Base class for Property, DerivedProperty, DynamicProperty.  Set methods are protected/not part of the public
 * interface.  Initial value and resetting is not defined here.
 */
export class ReadOnlyProperty<T> extends PhetioObject implements IReadOnlyProperty<T> {

  // Unique identifier for this Property.
  private readonly id: number;

  // (phet-io) Units, if any.  See units.js for valid values
  public units: string | null;

  public validValues: readonly T[] | undefined;

  // emit is called when the value changes (or on link)
  private tinyProperty: TinyProperty<T>;

  // whether we are in the process of notifying listeners; changed in some Property test files with @ts-ignore
  private notifying: boolean;

  // whether to allow reentry of calls to set
  private readonly reentrant: boolean;

  // while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
  // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
  // send notifications.
  protected isDeferred: boolean;

  // the value that this Property will take after no longer deferred
  protected deferredValue: T | null;

  // whether a deferred value has been set
  protected hasDeferredValue: boolean;

  public static CHANGED_EVENT_NAME: string;
  public static PropertyIO: ( parameterType: IOType ) => IOType;

  protected readonly valueValidator: Validator<T>;

  /**
   * This is protected to indicate to clients that subclasses should be used instead.
   * @param value - the initial value of the property
   * @param [providedOptions]
   */
  protected constructor( value: T, providedOptions?: PropertyOptions<T> ) {
    const options = optionize<PropertyOptions<T>, SelfOptions, PhetioObjectOptions>()( {

      useDeepEquality: false,
      units: null,
      reentrant: false,

      // phet-io
      tandem: Tandem.OPTIONAL
    }, providedOptions );

    // Support non-validated Property
    if ( !Validation.containsValidatorKey( options ) ) {

      options.isValidValue = () => true;
    }

    assert && options.units && assert( units.isValidUnits( options.units ), `invalid units: ${options.units}` );
    if ( options.units ) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};
      assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'units' ), 'units should be supplied by Property, not elsewhere' );
      options.phetioEventMetadata.units = options.units;
    }

    super( options );
    this.id = globalId++;
    this.units = options.units;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    if ( Tandem.VALIDATION && this.isPhetioInstrumented() ) {

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( !!options.phetioType,
        `phetioType passed to Property must be specified. Tandem.phetioID: ${this.tandem.phetioID}` );

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( options.phetioType!.parameterTypes[ 0 ],
        `phetioType parameter type must be specified (only one). Tandem.phetioID: ${this.tandem.phetioID}` );
    }
    assert && assert( !this.isPhetioInstrumented() ||
                      options.tandem.name.endsWith( 'Property' ) ||
                      options.tandem.name === 'property',
      `Property tandem.name must end with Property: ${options.tandem.phetioID}` );

    this.validValues = options.validValues;

    this.tinyProperty = new TinyProperty( value );

    // Since we are already in the heavyweight Property, we always assign useDeepEquality for clarity.
    // @ts-ignore
    this.tinyProperty.useDeepEquality = options.useDeepEquality;
    this.notifying = false;
    this.reentrant = options.reentrant;
    this.isDeferred = false;
    this.deferredValue = null;
    this.hasDeferredValue = false;

    this.valueValidator = _.pick( options, Validation.VALIDATOR_KEYS );
    this.valueValidator.validationMessage = this.valueValidator.validationMessage || 'Property value not valid';

    if ( this.valueValidator.phetioType ) {

      // Validate the value type's phetioType of the Property, not the PropertyIO itself.
      // For example, for PropertyIO( BooleanIO ), assign this valueValidator's phetioType to be BooleanIO's validator.
      assert && assert( !!this.valueValidator.phetioType.parameterTypes[ 0 ], 'unexpected number of parameters for Property' );

      // This is the validator for the value, not for the Property itself
      this.valueValidator.phetioType = this.valueValidator.phetioType.parameterTypes[ 0 ];
    }

    // Assertions regarding value validation
    if ( assert ) {
      Validation.validateValidator( this.valueValidator );

      // validate the initial value as well as any changes in the future
      this.link( ( value: T ) => validate( value, this.valueValidator, VALIDATE_OPTIONS_FALSE ) );
    }
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   */
  public isSettable(): boolean {
    return true;
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
   */
  protected set( value: T ): void {
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
    return this.areValuesEqual( value, this.get() );
  }

  /**
   * See TinyProperty.areValuesEqual
   */
  public areValuesEqual( a: T, b: T ): boolean {
    return this.tinyProperty.areValuesEqual( a, b );
  }

  /**
   * NOTE: a few sims are calling this even though they shouldn't
   */
  private _notifyListeners( oldValue: T | null ): void {
    const newValue = this.get();

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent( ReadOnlyProperty.CHANGED_EVENT_NAME, {
      getData: () => {
        const parameterType = this.phetioType.parameterTypes[ 0 ];
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
   * Only provides the new reference as a callback (no oldvalue)
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
    assert && assert( typeof isDeferred === 'boolean', 'bad value for isDeferred' );
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

  /**
   * Resets the value to the initial value.
   */
  protected reset(): void {

    // @ts-ignore
    this.set( this._initialValue );
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
  public addPhetioStateDependencies( dependencies: Array<ReadOnlyProperty<any> | TinyProperty<any>> ): void {
    assert && assert( Array.isArray( dependencies ), 'Array expected' );
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];

      // only if running in PhET-iO brand and both Properties are instrumenting
      if ( dependency instanceof ReadOnlyProperty && dependency.isPhetioInstrumented() && this.isPhetioInstrumented() ) {

        // The dependency should undefer (taking deferred value) before this Property notifies.
        propertyStateHandlerSingleton.registerPhetioOrderDependency( dependency, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.NOTIFY );
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
  public link( listener: PropertyLinkListener<T>, options?: any ): void {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }

    this.tinyProperty.addListener( listener ); // cannot use tinyProperty.link() because of wrong this
    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the Property, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   */
  public lazyLink( listener: PropertyLazyLinkListener<T>, options?: any ): void {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }
    this.tinyProperty.lazyLink( listener );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   */
  public unlink( listener: PropertyListener<T> ): void {
    this.tinyProperty.unlink( listener );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   */
  public unlinkAll(): void {
    this.tinyProperty.unlinkAll();
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * NOTE: Duplicated with TinyProperty.linkAttribute
   */
  public linkAttribute( object: any, attributeName: string ): ( value: T ) => void {
    const handle = ( value: T ) => { object[ attributeName ] = value; };
    this.link( handle );
    return handle;
  }

  /**
   * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
   * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
   */
  public unlinkAttribute( listener: PropertyLinkListener<T> ): void {
    this.unlink( listener );
  }

  /**
   * Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
   */
  public override toString(): string {
    return `Property#${this.id}{${this.get()}}`;
  }

  public override valueOf(): string {
    return this.toString();
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
}

// static attributes
ReadOnlyProperty.CHANGED_EVENT_NAME = 'changed';

// {Map.<IOType, IOType>} - Cache each parameterized PropertyIO based on
// the parameter type, so that it is only created once
const cache = new Map();

/**
 * An observable Property that triggers notifications when the value changes.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 */
ReadOnlyProperty.PropertyIO = ( parameterType: IOType ) => {
  assert && assert( parameterType, 'PropertyIO needs parameterType' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `PropertyIO<${parameterType.typeName}>`, {

      // We want PropertyIO to work for DynamicProperty and DerivedProperty, but they extend ReadOnlyProperty
      // However, we also want the ReadOnlyProperty constructor to be protected, so we must ignore this type error
      isValidValue: v => v instanceof ReadOnlyProperty,
      documentation: 'Observable values that send out notifications when the value changes. This differs from the ' +
                     'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                     'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
      methodOrder: [ 'link', 'lazyLink' ],
      events: [ 'changed' ],
      parameterTypes: [ parameterType ],
      toStateObject: ( property: ReadOnlyProperty<any> ) => {
        assert && assert( parameterType.toStateObject, `toStateObject doesn't exist for ${parameterType.typeName}` );
        const stateObject: any = {
          value: parameterType.toStateObject( property.value )
        };

        // Only include validValues if specified, so they only show up in PhET-iO Studio when supplied.
        if ( property.validValues ) {
          stateObject.validValues = property.validValues.map( v => {
            return parameterType.toStateObject( v );
          } );
        }
        else {
          stateObject.validValues = null;
        }

        stateObject.units = NullableIO( StringIO ).toStateObject( property.units );
        return stateObject;
      },
      applyState: ( property: ReadOnlyProperty<any>, stateObject: any ) => {
        property.units = NullableIO( StringIO ).fromStateObject( stateObject.units );

        // @ts-ignore TODO: see https://github.com/phetsims/axon/issues/342
        property.set( parameterType.fromStateObject( stateObject.value ) );

        if ( stateObject.validValues ) {
          property.validValues = stateObject.validValues.map( ( valueStateObject: any ) => parameterType.fromStateObject( valueStateObject ) );
        }
      },
      stateSchema: {
        value: parameterType,
        validValues: NullableIO( ArrayIO( parameterType ) ),
        units: NullableIO( StringIO )
      },
      methods: {
        getValue: {
          returnType: parameterType,
          parameterTypes: [],
          implementation: function( this: ReadOnlyProperty<any> ) {
            return this.get();
          },
          documentation: 'Gets the current value.'
        },
        getValidationError: {
          returnType: NullableIO( StringIO ),
          parameterTypes: [ parameterType ],
          implementation: function( this: ReadOnlyProperty<any>, value: any ) {
            return this.getValidationError( value );
          },
          documentation: 'Checks to see if a proposed value is valid. Returns the first validation error, or null if the value is valid.'
        },

        setValue: {
          returnType: VoidIO,
          parameterTypes: [ parameterType ],
          implementation: function( this: ReadOnlyProperty<any>, value: any ) {
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
          implementation: function( this: any, listener: any ) {
            this.link( listener );
          },
          documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is ' +
                         'also called with the current value. The listener takes two arguments, the new value and the ' +
                         'previous value.'
        },

        lazyLink: {
          returnType: VoidIO,

          // oldValue will start as "null" the first time called
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType, NullableIO( parameterType ) ] ) ],
          implementation: function( this: any, listener: any ) {
            this.lazyLink( listener );
          },
          documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' +
                         'without the current-value callback on registration. The listener takes two arguments, the new ' +
                         'value and the previous value.'
        },
        unlink: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
          implementation: function( this: any, listener: any ) {
            this.unlink( listener );
          },
          documentation: 'Removes a listener.'
        }
      }
    } ) );
  }

  return cache.get( parameterType );
};

axon.register( 'ReadOnlyProperty', ReadOnlyProperty );
