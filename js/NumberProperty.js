// Copyright 2016-2021, University of Colorado Boulder

/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Range from '../../dot/js/Range.js';
import merge from '../../phet-core/js/merge.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import Property from './Property.js';
import validate from './validate.js';

// constants
const VALID_INTEGER = { valueType: 'number', isValidValue: v => v % 1 === 0 };

// valid values for options.numberType to convey whether it is continuous or discrete with step size 1
const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

// For the IOType
const PropertyIOImpl = Property.PropertyIO( NumberIO );

class NumberProperty extends Property {

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  constructor( value, options ) {

    options = merge( {
      numberType: 'FloatingPoint', // {string} see VALID_NUMBER_TYPES

      // {Range|Property.<Range|null>|null} range
      range: null,

      // {number|null} step - used by PhET-iO Studio to control this Property
      step: null,

      // To be passed to the rangeProperty if NumberProperty creates it (as rangeProperty can also be passed via options.range)
      // By default, this is not PhET-iO instrumented, if desired, pass a tandem through these options with name "rangeProperty"
      rangePropertyOptions: {
        phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
        phetioType: Property.PropertyIO( NullableIO( Range.RangeIO ) ),
        phetioReadOnly: true
      },

      // {Tandem}
      tandem: Tandem.OPTIONAL
    }, options );

    // options that depend on other options
    options = merge( {
      rangePropertyOptions: {
        tandem: options.tandem.createTandem( 'rangeProperty' ) // must be 'rangeProperty', see assertion below
      }
    }, options );

    assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), `invalid numberType: ${options.numberType}` );
    assert && assert( options.range instanceof Range || options.range instanceof Property || options.range === null,
      `invalid range${options.range}` );
    assert && options.step && assert( typeof options.step === 'number', `invalid step:${options.step}` );

    assert && assert( options.rangePropertyOptions instanceof Object, 'rangePropertyOptions should be an Object' );
    assert && assert( options.rangePropertyOptions.tandem === Tandem.OPTIONAL || options.rangePropertyOptions.tandem.name === 'rangeProperty',
      'if instrumenting default rangeProperty, the tandem name should be "rangeProperty".' );

    // client cannot specify superclass options that are controlled by NumberProperty
    assert && assert( !options.valueType, 'NumberProperty sets valueType' );
    options.valueType = 'number';
    assert && assert( !options.phetioType, 'NumberProperty sets phetioType' );
    options.phetioType = NumberProperty.NumberPropertyIO;

    const rangePropertyProvided = options.range && options.range instanceof Property;
    const ownsRangeProperty = !rangePropertyProvided;

    super( value, options );

    // @public (read-only) - used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
    this.numberType = options.numberType;

    // @public {number|null} (read-only - If defined, provides a step that the NumberProperty can be
    // incremented/decremented.
    this.step = options.step;

    // @private {function|null} validation for NumberProperty and its rangeProperty, null if assertions are disabled
    this.validateNumberProperty = assert && ( value => {

      // validate for integer
      ( options.numberType === 'Integer' ) && validate( value, VALID_INTEGER );

      // validate range value type
      validate( this.rangeProperty.value, { isValidValue: value => ( value instanceof Range || value === null ) } );

      // validate that value and range are compatible
      if ( this.rangeProperty.value ) {
        validate( value, { isValidValue: value => this.rangeProperty.value.contains( value ) } );
      }
    } );

    // @public (read-only) {Property.<Range|null>}
    this.rangeProperty = null;
    if ( ownsRangeProperty ) {
      this.rangeProperty = new Property( options.range, options.rangePropertyOptions );
    }
    else {
      this.rangeProperty = options.range;
    }
    assert && assert( this.rangeProperty instanceof Property, 'this.rangeProperty should be a Property' );
    assert && Tandem.VALIDATION && this.isPhetioInstrumented() && assert( this.rangeProperty.isPhetioInstrumented(),
      'rangeProperty must be instrument if NumberProperty is instrumented' );

    const rangePropertyObserver = range => {
      this.validateNumberProperty && this.validateNumberProperty( this.value );
    };
    this.rangeProperty.link( rangePropertyObserver );

    // For PhET-iO State, make sure that both the range and this value are correct before firing notifications (where the assertions are).
    this.rangeProperty.addPhetioStateDependencies( [ this ] );
    this.addPhetioStateDependencies( [ this.rangeProperty ] );

    // verify that validValues meet other NumberProperty-specific validation criteria
    if ( options.validValues && this.validateNumberProperty ) {
      options.validValues.forEach( validValue => this.validateNumberProperty( validValue ) );
    }

    // This puts validation at notification time instead of at value setting time. This is especially helpful as it
    // pertains to Property.prototype.setDeferred(), and setting a range and value together.
    this.validateNumberProperty && this.link( value => {
      this.validateNumberProperty( value );
    } );

    // @private
    this.disposeNumberProperty = () => {
      if ( ownsRangeProperty ) {
        this.rangeProperty.dispose();
      }
      else {
        this.rangeProperty.unlink( rangePropertyObserver );
      }
    };

    // @private
    this.resetNumberProperty = () => {
      ownsRangeProperty && this.rangeProperty.reset();
    };
  }

  /**
   * @public
   * @returns {Range|null}
   */
  get range() {
    return this.rangeProperty.value;
  }

  /**
   * Convenience function for setting the rangeProperty. Note: be careful using this function, as validation will occur
   * immediately, and if the value is outside of this new Range an error will occur. See this.setValueAndRange() for
   *  way to set both at once without assertion errors.
   *
   * @public
   * @param {Range} range
   */
  set range( range ) {
    this.rangeProperty.value = range;
  }

  /**
   * @public
   * @overrides
   */
  reset() {
    super.reset();

    // Do subclass-specific reset after the value has been reset, because this reset may change the range
    // such that the value isn't valid anymore.
    this.resetNumberProperty();
  }

  /**
   * @public
   * @override
   */
  dispose() {
    this.disposeNumberProperty();
    super.dispose();
  }

  /**
   * An atomic setting function that will set a range and a value at the same time, to make sure that validation does
   * not fail after one but has been set not the other.
   * @param {number} value
   * @param {Range} range
   * @public
   */
  setValueAndRange( value, range ) {
    assert && assert( range.contains( value ), `value ${value} is not in range [${range.min},${range.max}]` );

    // defer notification of listeners
    this.setDeferred( true );
    this.rangeProperty.setDeferred( true );

    // set values
    this.set( value );
    this.rangeProperty.set( range );

    // notify listeners if the values have changed
    const notifyValueListeners = this.setDeferred( false );
    const notifyRangeListeners = this.rangeProperty.setDeferred( false );
    notifyValueListeners && notifyValueListeners();
    notifyRangeListeners && notifyRangeListeners();
  }

  /**
   * Resets the value and range atomically.
   * If you use setValueAndRange, you'll likely need to use this instead of reset.
   * @public
   */
  resetValueAndRange() {
    this.setValueAndRange( this.initialValue, this.rangeProperty.initialValue );
  }
}

NumberProperty.NumberPropertyIO = new IOType( 'NumberPropertyIO', {
  valueType: NumberProperty,
  supertype: PropertyIOImpl,
  parameterTypes: [ NumberIO ],
  documentation: `Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( '${
    VALID_NUMBER_TYPES.join( '\' | \'' )}' )`,
  toStateObject: numberProperty => {

    const parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

    parentStateObject.numberType = StringIO.toStateObject( numberProperty.numberType );
    parentStateObject.range = NullableIO( Range.RangeIO ).toStateObject( numberProperty.rangeProperty.value );

    const hasRangePhetioID = numberProperty.rangeProperty && numberProperty.rangeProperty.isPhetioInstrumented();
    parentStateObject.rangePhetioID = hasRangePhetioID ? StringIO.toStateObject( numberProperty.rangeProperty.tandem.phetioID ) : null;

    parentStateObject.step = NullableIO( NumberIO ).toStateObject( numberProperty.step );
    return parentStateObject;
  },
  applyState: ( numberProperty, stateObject ) => {
    // nothing to do here for range, because in order to support range, this NumberProperty's rangeProperty must be instrumented.

    PropertyIOImpl.applyState( numberProperty, stateObject );
    numberProperty.step = stateObject.step;
    numberProperty.numberType = stateObject.numberType;
  },
  stateSchema: {
    numberType: StringIO,
    range: NullableIO( Range.RangeIO ),
    rangePhetioID: NullableIO( StringIO ),
    step: NullableIO( NumberIO ),
    value: NumberIO
  }
} );

axon.register( 'NumberProperty', NumberProperty );
export default NumberProperty;