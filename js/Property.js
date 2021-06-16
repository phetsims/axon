// Copyright 2013-2021, University of Colorado Boulder

/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import Multilink from './Multilink.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import TinyProperty from './TinyProperty.js';
import units from './units.js';
import validate from './validate.js';
import ValidatorDef from './ValidatorDef.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// variables
let globalId = 0; // autoincremented for unique IDs

class Property extends PhetioObject {

  /**
   * @param {*} value - the initial value of the property
   * @param {Object} [options] - options
   */
  constructor( value, options ) {
    options = merge( {

      tandem: Tandem.OPTIONAL, // workaround for https://github.com/phetsims/tandem/issues/50

      // useDeepEquality: true => Use the `equals` method on the values
      // useDeepEquality: false => Use === for equality test
      useDeepEquality: false,

      // {string|null} units for the number, see units.js. Should prefer abbreviated units, see https://github.com/phetsims/phet-io/issues/530
      units: null,

      // {boolean} Whether reentrant calls to 'set' are allowed.
      // Use this to detect or prevent update cycles. Update cycles may be due to floating point error,
      // faulty logic, etc. This may be of particular interest for PhET-iO instrumentation, where such
      // cycles may pollute the data stream. See https://github.com/phetsims/axon/issues/179
      reentrant: false,

      // {function()|null} - if specified, runs before listeners are notified. Typically used to ensure a consistent state
      //                   - or accomplish any work that must be done before any listeners are notified.
      onBeforeNotify: null

      // Property also supports validator options, see ValidatorDef.VALIDATOR_KEYS.

    }, options );

    // Support non-validated Property
    if ( !ValidatorDef.containsValidatorKey( options ) ) {
      options.isValidValue = () => true;
    }

    assert && options.units && assert( units.isValidUnits( options.units ), `invalid units: ${options.units}` );
    if ( options.units ) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};
      assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'units' ), 'units should be supplied by Property, not elsewhere' );
      options.phetioEventMetadata.units = options.units;
    }

    super( options );

    // @public {number} - Unique identifier for this Property.
    this.id = globalId++;

    // @public (phet-io) Units, if any.  See units.js for valid values
    this.units = options.units;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    if ( Tandem.VALIDATION && this.isPhetioInstrumented() ) {

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( !!options.phetioType,
        `phetioType passed to Property must be specified. Tandem.phetioID: ${this.tandem.phetioID}` );

      // This assertion helps in instrumenting code that has the tandem but not type
      assert && assert( !!options.phetioType.parameterTypes[ 0 ],
        `phetioType parameter type must be specified (only one). Tandem.phetioID: ${this.tandem.phetioID}` );
    }
    assert && assert( !this.isPhetioInstrumented() ||
                      options.tandem.name.endsWith( 'Property' ) ||
                      options.tandem.name === 'property',
      `Property tandem.name must end with Property: ${options.tandem.phetioID}` );

    // @protected - Initial value
    this._initialValue = value;

    // @public (read-only)
    this.validValues = options.validValues;

    // @private - emit is called when the value changes (or on link)
    this.tinyProperty = new TinyProperty( value, options.onBeforeNotify );

    // Since we are already in the heavyweight Property, we always assign useDeepEquality for clarity.
    this.tinyProperty.useDeepEquality = options.useDeepEquality;

    // @private whether we are in the process of notifying listeners
    this.notifying = false;

    // @private whether to allow reentry of calls to set
    this.reentrant = options.reentrant;

    // @public (read-only) - while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
    // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
    // send notifications.
    this.isDeferred = false;

    // @protected {*} - the value that this Property will take after no longer deferred
    this.deferredValue = null;

    // @private {boolean} whether a deferred value has been set
    this.hasDeferredValue = false;

    // Assertions regarding value validation
    if ( assert ) {
      const validator = _.pick( options, ValidatorDef.VALIDATOR_KEYS );

      // Validate the value type's phetioType of the Property, not the PropertyIO itself.
      // For example, for PropertyIO( BooleanIO ), assign this validator's phetioType to be BooleanIO's validator.
      if ( validator.phetioType ) {
        assert( !!validator.phetioType.parameterTypes[ 0 ], 'unexpected number of parameters for Property' );
        validator.phetioType = validator.phetioType.parameterTypes[ 0 ];
      }
      ValidatorDef.validateValidator( validator );

      // validate the initial value as well as any changes in the future
      this.link( value => validate( value, validator, 'Property value not valid', VALIDATE_OPTIONS_FALSE ) );
    }
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   * @returns {boolean}
   * @public
   */
  isSettable() {
    return true;
  }

  /**
   * Gets the value.
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   * @public
   */
  get() {
    return this.tinyProperty.get();
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * @param {*} value
   * @returns {Property} this instance, for chaining.
   * @public
   */
  set( value ) {
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
    return this;
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   *
   * @param {*} value
   * @protected - for overriding only
   */
  setPropertyValue( value ) {
    this.tinyProperty.setPropertyValue( value );
  }

  /**
   * Stores the specified value as the initial value, which will be taken on reset. Sims should use this sparingly,
   * typically only in situations where the initial value is unknowable at instantiation.
   *
   * @param {*} initialValue
   * @public
   */
  setInitialValue( initialValue ) {
    this._initialValue = initialValue;
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   * @param {Object} value
   * @returns {boolean}
   * @protected
   */
  equalsValue( value ) {
    return this.areValuesEqual( value, this.get() );
  }

  /**
   * See TinyProperty.areValuesEqual
   * @param {*} a
   * @param {*} b
   * @returns {boolean}
   * @public
   */
  areValuesEqual( a, b ) {
    return this.tinyProperty.areValuesEqual( a, b );
  }

  /**
   * Returns the initial value of this Property.
   * @public
   *
   * @returns {*}
   */
  getInitialValue() {
    return this._initialValue;
  }

  // @public
  get initialValue() {
    return this.getInitialValue();
  }

  /**
   * @param {*} oldValue
   * @private - but note that a few sims are calling this even though they shouldn't
   */
  _notifyListeners( oldValue ) {
    const newValue = this.get();

    this.phetioStartEvent( Property.CHANGED_EVENT_NAME, {
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

    this.phetioEndEvent();
  }

  /**
   * Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
   * This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
   * This method is unsafe for removing listeners because it assumes the listener list not modified, to save another allocation
   * Only provides the new reference as a callback (no oldvalue)
   * See https://github.com/phetsims/axon/issues/6
   * @public
   */
  notifyListenersStatic() {
    this._notifyListeners( null );
  }

  /**
   * When deferred, set values do not take effect or send out notifications.  After defer ends, the Property takes
   * its deferred value (if any), and a follow-up action (return value) can be invoked to send out notifications
   * once other Properties have also taken their deferred values.
   *
   * @param {boolean} isDeferred - whether the Property should be deferred or not
   * @returns {function|null} - function to notify listeners after calling setDeferred(false),
   *                          - null if isDeferred is true, or if the value is unchanged since calling setDeferred(true)
   * @public
   */
  setDeferred( isDeferred ) {
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
        this.setPropertyValue( this.deferredValue );
        this.hasDeferredValue = false;
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
   * @public
   */
  reset() {
    this.set( this._initialValue );
  }

  // @public
  get value() { return this.get(); }

  // @public
  set value( newValue ) { this.set( newValue ); }

  /**
   * This function registers an order dependency between this Property and another. Basically this says that when
   * setting PhET-iO state, each dependency must take its final value before this Property fires its notifications.
   * See propertyStateHandlerSingleton.registerPhetioOrderDependency and https://github.com/phetsims/axon/issues/276 for more info.
   * @param {Array.<Property|TinyProperty>} dependencies
   * @protected
   */
  addPhetioStateDependencies( dependencies ) {
    assert && assert( Array.isArray( dependencies ), 'Array expected' );
    for ( let i = 0; i < dependencies.length; i++ ) {
      const dependency = dependencies[ i ];

      // only if running in PhET-iO brand and both Properties are instrumenting
      if ( dependency instanceof Property && dependency.isPhetioInstrumented() && this.isPhetioInstrumented() ) {

        // The dependency should undefer (taking deferred value) before this Property notifies.
        propertyStateHandlerSingleton.registerPhetioOrderDependency( dependency, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.NOTIFY );
      }
    }
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   *
   * @param {function(newValue:*,oldValue:*,Property)} listener - a function that takes a new value, old value, and this Property as arguments
   * @param {Object} [options]
   * @public
   */
  link( listener, options ) {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }

    this.tinyProperty.addListener( listener ); // cannot use tinyProperty.link() because of wrong this
    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Add an listener to the Property, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   * @param {function(newValue:*,oldValue:*,Property)} listener - a function that takes a new value, old value, and this Property as arguments
   * @param {Object} [options]
   * @public
   */
  lazyLink( listener, options ) {
    if ( options && options.phetioDependencies ) {
      this.addPhetioStateDependencies( options.phetioDependencies );
    }
    this.tinyProperty.lazyLink( listener );
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   *
   * @param {function} listener
   * @public
   */
  unlink( listener ) {
    this.tinyProperty.unlink( listener );
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   * @public
   */
  unlinkAll() {
    this.tinyProperty.unlinkAll();
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * NOTE: Duplicated with TinyProperty.linkAttribute
   *
   * @param {*} object
   * @param {string} attributeName
   * @returns {function}
   * @public
   */
  linkAttribute( object, attributeName ) {
    const handle = value => { object[ attributeName ] = value; };
    this.link( handle );
    return handle;
  }

  /**
   * Unlink an listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
   * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
   *
   * @param {function} listener
   * @public
   */
  unlinkAttribute( listener ) {
    this.unlink( listener );
  }

  /**
   * Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
   * @returns {string}
   * @override
   * @public
   */
  toString() {return `Property#${this.id}{${this.get()}}`; }

  /**
   * @returns {string}
   * @public
   */
  valueOf() {return this.toString();}

  /**
   * Convenience function for debugging a Property's value. It prints the new value on registration and when changed.
   * @param {string} name - debug name to be printed on the console
   * @returns {function} - the handle to the linked listener in case it needs to be removed later
   * @public
   */
  debug( name ) {
    const listener = value => console.log( name, value );
    this.link( listener );
    return listener;
  }

  /**
   * Modifies the value of this Property with the ! operator.  Works for booleans and non-booleans.
   * @public
   */
  toggle() {
    this.value = !this.value;
  }

  // @public Ensures that the Property is eligible for GC
  dispose() {

    // unregister any order dependencies for this Property for PhET-iO state
    if ( this.isPhetioInstrumented() ) {
      propertyStateHandlerSingleton.unregisterOrderDependenciesForProperty( this );
    }

    super.dispose();
    this.tinyProperty.dispose();
  }

  /**
   * Checks whether a listener is registered with this Property
   * @param {function} listener
   * @returns {boolean}
   * @public
   */
  hasListener( listener ) {
    return this.tinyProperty.hasListener( listener );
  }

  /**
   * Returns the number of listeners.
   * @returns {number}
   * @public
   */
  getListenerCount() {
    return this.tinyProperty.getListenerCount();
  }

  /**
   * Invokes a callback once for each listener
   * @param {function} callback - takes the listener as an argument
   * @public (ShapePlacementBoard)
   */
  forEachListener( callback ) {
    this.tinyProperty.forEachListener( callback );
  }

  /**
   * Returns true if there are any listeners.
   * @returns {boolean}
   * @public
   */
  hasListeners() {
    assert && assert( arguments.length === 0, 'Property.hasListeners should be called without arguments' );
    return this.tinyProperty.hasListeners();
  }

  /**
   * Registers a listener with multiple properties, then notifies the listener immediately.
   * @param {Property[]} properties
   * @param {function} listener function that takes values from the properties and returns nothing
   * @returns {Multilink}
   * @public
   */
  static multilink( properties, listener ) {
    return new Multilink( properties, listener, false );
  }

  /**
   * Registers an listener with multiple properties *without* an immediate callback with current values.
   * @param {Property[]} properties
   * @param {function} listener function that takes values from the properties and returns nothing
   * @returns {Multilink}
   * @public
   */
  static lazyMultilink( properties, listener ) {
    return new Multilink( properties, listener, true );
  }

  /**
   * Unlinks an listener that was added with multilink or lazyMultilink.
   * @param {Multilink} multilink
   * @public
   */
  static unmultilink( multilink ) {
    multilink.dispose();
  }
}

// static attributes
Property.CHANGED_EVENT_NAME = 'changed';


// {Map.<IOType, IOType>} - Cache each parameterized PropertyIO based on
// the parameter type, so that it is only created once
const cache = new Map();

/**
 * An observable Property that triggers notifications when the value changes.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {IOType} parameterType
 * @returns {IOType}
 */
Property.PropertyIO = parameterType => {
  assert && assert( parameterType, 'PropertyIO needs parameterType' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, new IOType( `PropertyIO<${parameterType.typeName}>`, {
      valueType: Property,
      documentation: 'Observable values that send out notifications when the value changes. This differs from the ' +
                     'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                     'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
      methodOrder: [ 'link', 'lazyLink' ],
      events: [ 'changed' ],
      parameterTypes: [ parameterType ],
      toStateObject: property => {
        assert && assert( parameterType.toStateObject, `toStateObject doesn't exist for ${parameterType.typeName}` );
        const stateObject = {
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
      applyState: ( property, stateObject ) => {
        property.units = NullableIO( StringIO ).fromStateObject( stateObject.units );
        property.set( parameterType.fromStateObject( stateObject.value ) );

        if ( stateObject.validValues ) {
          property.validValues = stateObject.validValues.map( valueStateObject => parameterType.fromStateObject( valueStateObject ) );
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
          implementation: function() {
            return this.get();
          },
          documentation: 'Gets the current value.'
        },

        setValue: {
          returnType: VoidIO,
          parameterTypes: [ parameterType ],
          implementation: function( value ) {
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
          implementation: function( listener ) {
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
          implementation: function( listener ) {
            this.lazyLink( listener );
          },
          documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' +
                         'without the current-value callback on registration. The listener takes two arguments, the new ' +
                         'value and the previous value.'
        },
        unlink: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
          implementation: function( listener ) {
            this.unlink( listener );
          },
          documentation: 'Removes a listener.'
        }
      }
    } ) );
  }

  return cache.get( parameterType );
};

axon.register( 'Property', Property );
export default Property;