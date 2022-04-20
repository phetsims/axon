// Copyright 2016-2022, University of Colorado Boulder
/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Range from '../../dot/js/Range.js';
import merge from '../../phet-core/js/merge.js';
import optionize from '../../phet-core/js/optionize.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import IReadOnlyProperty from './IReadOnlyProperty.js';
import Property, { PropertyOptions } from './Property.js';
import validate from './validate.js';

const VALID_INTEGER = { valueType: 'number', isValidValue: ( v: number ) => v % 1 === 0, validationMessage: 'Should be a valid integer' };
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// valid values for options.numberType to convey whether it is continuous or discrete with step size 1
const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

type NumberType = 'Integer' | 'FloatingPoint';

// For the IOType
const PropertyIOImpl = Property.PropertyIO( NumberIO );

type SelfOptions = {
  numberType?: NumberType;
  range?: Range | Property<Range | null> | null;

  // To be passed to the rangeProperty if NumberProperty creates it (as rangeProperty can also be passed via options.range)
  rangePropertyOptions?: Partial<PropertyOptions<Range>>;

};

export type NumberPropertyOptions = SelfOptions & Omit<PropertyOptions<number>, 'phetioType' | 'valueType'>;

// Minimal types for ranged Properties
export type RangedProperty = Property<number> & { range: Range; readonly rangeProperty: IReadOnlyProperty<Range> };

// User-defined type guards for ranged Properties. Only use these when you know that a null value won't be set
// to the range
export const isRangedProperty = ( property: Property<number> ): property is RangedProperty => {
  return ( property as RangedProperty ).range && ( property as RangedProperty ).range !== null;
};

export default class NumberProperty extends Property<number> {

  // Used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
  // @readonly, but cannot set as such because it is set by PhET-iO state.
  numberType: NumberType;

  // validation for NumberProperty and its rangeProperty, undefined if assertions are disabled
  private readonly validateNumberAndRangeProperty: ( ( value: any ) => void ) | undefined;

  readonly rangeProperty: Property<Range | null>;
  private readonly disposeNumberProperty: () => void;
  static NumberPropertyIO: IOType;
  private readonly resetNumberProperty: () => void;

  constructor( value: number, providedOptions?: NumberPropertyOptions ) {

    let options = optionize<NumberPropertyOptions, SelfOptions, PropertyOptions<number>>()( {
      numberType: 'FloatingPoint',
      range: null,

      // By default, this is not PhET-iO instrumented, if desired, pass a tandem through these options with name "rangeProperty"
      rangePropertyOptions: {
        phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
        phetioType: Property.PropertyIO( NullableIO( Range.RangeIO ) ),
        phetioReadOnly: true
      },

      validators: [],

      // {Tandem}
      tandem: Tandem.OPTIONAL
    }, providedOptions );

    // options that depend on other options
    options = merge( {
      rangePropertyOptions: {
        tandem: options.tandem.createTandem( 'rangeProperty' ) // must be 'rangeProperty', see assertion below
      }
    }, options );

    assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), `invalid numberType: ${options.numberType}` );
    assert && assert( options.range instanceof Range || options.range instanceof Property || options.range === null,
      `invalid range${options.range}` );

    assert && assert( options.rangePropertyOptions instanceof Object, 'rangePropertyOptions should be an Object' );
    assert && assert( options.rangePropertyOptions.tandem === Tandem.OPTIONAL || options.rangePropertyOptions.tandem!.name === 'rangeProperty',
      'if instrumenting default rangeProperty, the tandem name should be "rangeProperty".' );

    // client cannot specify superclass options that are controlled by NumberProperty
    options.valueType = 'number';
    options.phetioType = NumberProperty.NumberPropertyIO;

    const rangePropertyProvided = options.range && options.range instanceof Property;
    const ownsRangeProperty = !rangePropertyProvided;

    let rangeProperty: Property<Range | null>;
    if ( options.range instanceof Property ) {
      rangeProperty = options.range;
    }
    else {
      rangeProperty = new Property( options.range, options.rangePropertyOptions );
    }

    if ( options.numberType === 'Integer' ) {
      options.validators.push( VALID_INTEGER );
    }
    options.validators.push( {
      isValidValue: v => {
        const range = rangeProperty.value;
        return range === null || range.contains( v );
      },
      validationMessage: 'Number must be within rangeProperty value.'
    } );

    super( value, options );

    this.numberType = options.numberType;
    this.rangeProperty = rangeProperty;

    assert && Tandem.VALIDATION && this.isPhetioInstrumented() && assert( this.rangeProperty.isPhetioInstrumented(),
      'rangeProperty must be instrument if NumberProperty is instrumented' );

    const rangePropertyObserver = () => {
      validate( this.value, this.valueTypeValidator, VALIDATE_OPTIONS_FALSE );
    };
    assert && this.rangeProperty.link( rangePropertyObserver );

    // For PhET-iO State, make sure that both the range and this value are correct before firing notifications (where the assertions are).
    this.rangeProperty.addPhetioStateDependencies( [ this ] );
    this.addPhetioStateDependencies( [ this.rangeProperty ] );

    // verify that validValues meet other NumberProperty-specific validation criteria
    if ( options.validValues && this.validateNumberAndRangeProperty ) {
      for ( let i = 0; i < options.validValues.length; i++ ) {
        const validValue = options.validValues[ i ];
        this.validateNumberAndRangeProperty( validValue );
      }
    }

    this.disposeNumberProperty = () => {
      if ( ownsRangeProperty ) {
        this.rangeProperty.dispose();
      }
      else if ( assert ) {
        this.rangeProperty.unlink( rangePropertyObserver );
      }
    };

    this.resetNumberProperty = () => {
      ownsRangeProperty && this.rangeProperty.reset();
    };
  }

  get range(): Range | null {
    return this.rangeProperty.value;
  }

  /**
   * Convenience function for setting the rangeProperty. Note: be careful using this function, as validation will occur
   * immediately, and if the value is outside of this new Range an error will occur. See this.setValueAndRange() for
   *  way to set both at once without assertion errors.
   */
  set range( range: Range | null ) {
    this.rangeProperty.value = range;
  }

  override reset(): void {
    super.reset();

    // Do subclass-specific reset after the value has been reset, because this reset may change the range
    // such that the value isn't valid anymore.
    this.resetNumberProperty();
  }

  override dispose(): void {
    this.disposeNumberProperty();
    super.dispose();
  }

  /**
   * An atomic setting function that will set a range and a value at the same time, to make sure that validation does
   * not fail after one but has been set not the other.
   */
  setValueAndRange( value: number, range: Range ): void {
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
   */
  resetValueAndRange(): void {
    this.setValueAndRange( this.initialValue!, this.rangeProperty.initialValue! );
  }

  // Returns a casted version with a guaranteed non-null range
  asRanged(): RangedProperty {
    if ( isRangedProperty( this ) ) {
      return this;
    }
    else {
      throw new Error( 'Not a RangedProperty' );
    }
  }
}

NumberProperty.NumberPropertyIO = new IOType( 'NumberPropertyIO', {
  valueType: NumberProperty,
  supertype: PropertyIOImpl,
  parameterTypes: [ NumberIO ],
  documentation: `Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( '${
    VALID_NUMBER_TYPES.join( '\' | \'' )}' )`,
  toStateObject: ( numberProperty: NumberProperty ) => {

    const parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

    parentStateObject.numberType = StringIO.toStateObject( numberProperty.numberType );
    parentStateObject.range = NullableIO( Range.RangeIO ).toStateObject( numberProperty.rangeProperty.value );

    const hasRangePhetioID = numberProperty.rangeProperty && numberProperty.rangeProperty.isPhetioInstrumented();
    parentStateObject.rangePhetioID = hasRangePhetioID ? StringIO.toStateObject( numberProperty.rangeProperty.tandem.phetioID ) : null;

    return parentStateObject;
  },
  applyState: ( numberProperty: NumberProperty, stateObject: any ) => {
    // nothing to do here for range, because in order to support range, this NumberProperty's rangeProperty must be instrumented.

    PropertyIOImpl.applyState( numberProperty, stateObject );

    numberProperty.numberType = stateObject.numberType;
  },
  stateSchema: {
    numberType: StringIO,
    range: NullableIO( Range.RangeIO ),
    rangePhetioID: NullableIO( StringIO ),
    value: NumberIO
  }
} );

axon.register( 'NumberProperty', NumberProperty );
