// Copyright 2016-2022, University of Colorado Boulder

/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Range, { RangeStateObject } from '../../dot/js/Range.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import Property, { PropertyOptions } from './Property.js';
import validate from './validate.js';

const VALID_INTEGER = { valueType: 'number', isValidValue: ( v: number ) => v % 1 === 0, validationMessage: 'Should be a valid integer' };
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// valid values for options.numberType to convey whether it is continuous or discrete with step size 1
const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ] as const;
type NumberType = typeof VALID_NUMBER_TYPES[number];

// standardized tandem name for rangeProperty
const RANGE_PROPERTY_TANDEM_NAME = 'rangeProperty';

export type NumberPropertyState = {
  numberType: string;
  range: null | RangeStateObject;
  rangePhetioID: string | null;
} & ReadOnlyProperty<number>;

// For the IOType
const PropertyIOImpl = Property.PropertyIO( NumberIO );

type SelfOptions = {
  numberType?: NumberType;
  range?: Range | Property<Range | null> | null;

  // Passed to this.rangeProperty if NumberProperty creates it. Ignored if a Property is provided via options.range.
  rangePropertyOptions?: PropertyOptions<Range | null>;
};

export type NumberPropertyOptions = SelfOptions & StrictOmit<PropertyOptions<number>, 'phetioValueType' | 'valueType'>;

// Minimal types for ranged Properties - Generally use `new NumberProperty( ... ).asRanged()`
export type RangedProperty = Property<number> & { range: Range; readonly rangeProperty: TReadOnlyProperty<Range> };

// User-defined type guards for ranged Properties. Only use these when you know that a null value won't be set
// to the range
export const isRangedProperty = ( property: TReadOnlyProperty<number> ): property is RangedProperty => {
  return ( property as RangedProperty ).range && ( property as RangedProperty ).range !== null;
};

export default class NumberProperty extends Property<number> {

  // Used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
  // @readonly, but cannot set as such because it is set by PhET-iO state.
  private readonly numberType: NumberType;

  // validation for NumberProperty and its rangeProperty, undefined if assertions are disabled
  private readonly validateNumberAndRangeProperty: ( ( value: number ) => void ) | undefined;

  public readonly rangeProperty: Property<Range | null>;
  private readonly disposeNumberProperty: () => void;
  private readonly resetNumberProperty: () => void;

  public constructor( value: number, providedOptions?: NumberPropertyOptions ) {

    const options = optionize<NumberPropertyOptions, StrictOmit<SelfOptions, 'rangePropertyOptions'>, PropertyOptions<number>>()( {

      // NumberPropertyOptions
      numberType: 'FloatingPoint',
      range: null,

      // PropertyOptions
      validators: [],
      tandem: Tandem.OPTIONAL
    }, providedOptions );

    // Defaults for rangePropertyOptions, since it depends on options.tandem
    const rangePropertyDefaults = options.range ? {
      phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
      phetioValueType: NullableIO( Range.RangeIO ),
      phetioReadOnly: true,
      tandem: options.tandem.createTandem( RANGE_PROPERTY_TANDEM_NAME )
    } : {};
    options.rangePropertyOptions = optionize<PropertyOptions<Range | null>, EmptySelfOptions, PropertyOptions<Range>>()( rangePropertyDefaults, options.rangePropertyOptions );

    if ( assert && options.rangePropertyOptions.tandem ) {
      assert && assert( !options.rangePropertyOptions.tandem.supplied || options.rangePropertyOptions.tandem.name === RANGE_PROPERTY_TANDEM_NAME,
        `rangePropertyOptions.tandem.name must be ${RANGE_PROPERTY_TANDEM_NAME}: ${options.rangePropertyOptions.tandem.name}` );
    }

    // client cannot specify superclass options that are controlled by NumberProperty
    options.valueType = 'number';
    options.phetioOuterType = () => NumberProperty.NumberPropertyIO;
    options.phetioValueType = NumberIO; // not actually used, but for completeness, don't have ReadOnlyProperty storing the wrong default.

    const rangePropertyProvided = options.range && options.range instanceof ReadOnlyProperty;
    const ownsRangeProperty = !rangePropertyProvided;

    let rangeProperty: Property<Range | null>;
    if ( options.range instanceof ReadOnlyProperty ) {
      rangeProperty = options.range;
    }
    else {
      rangeProperty = new Property<Range | null>( options.range, options.rangePropertyOptions );
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

    if ( assert && Tandem.VALIDATION && this.rangeProperty.isPhetioInstrumented() ) {
      assert && assert( this.isPhetioInstrumented(), 'NumberProperty must be phet-io instrumented if the range is' );
    }

    const rangePropertyObserver = () => {
      validate( this.value, this.valueValidator, VALIDATE_OPTIONS_FALSE );
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

  public get range(): Range | null {
    return this.rangeProperty.value;
  }

  /**
   * Convenience function for setting the rangeProperty. Note: be careful using this function, as validation will occur
   * immediately, and if the value is outside of this new Range an error will occur. See this.setValueAndRange() for
   *  way to set both at once without assertion errors.
   */
  public set range( range: Range | null ) {
    this.rangeProperty.value = range;
  }

  public override reset(): void {
    super.reset();

    // Do subclass-specific reset after the value has been reset, because this reset may change the range
    // such that the value isn't valid anymore.
    this.resetNumberProperty();
  }

  public override dispose(): void {
    this.disposeNumberProperty();
    super.dispose();
  }

  /**
   * An atomic setting function that will set a range and a value at the same time, to make sure that validation does
   * not fail after one but has been set not the other.
   */
  public setValueAndRange( value: number, range: Range ): void {
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
  public resetValueAndRange(): void {
    this.setValueAndRange( this.initialValue, this.rangeProperty.initialValue! );
  }

  // Returns a casted version with a guaranteed non-null range
  public asRanged(): RangedProperty {
    if ( isRangedProperty( this ) ) {
      return this;
    }
    else {
      throw new Error( 'Not a RangedProperty' );
    }
  }

  /**
   * Get parent state and append NumberProperty-specific metadata to it.
   */
  public toStateObject(): NumberPropertyState {
    const parentStateObject = PropertyIOImpl.toStateObject( this );

    parentStateObject.numberType = this.numberType;
    parentStateObject.range = NullableIO( Range.RangeIO ).toStateObject( this.rangeProperty.value );

    const hasRangePhetioID = this.rangeProperty && this.rangeProperty.isPhetioInstrumented();
    parentStateObject.rangePhetioID = hasRangePhetioID ? this.rangeProperty.tandem.phetioID : null;

    return parentStateObject;
  }

  public static NumberPropertyIO = new IOType<NumberProperty, NumberPropertyState>( 'NumberPropertyIO', {
    valueType: NumberProperty,
    supertype: PropertyIOImpl,

    parameterTypes: [ NumberIO ],
    documentation: `Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( '${
      VALID_NUMBER_TYPES.join( '\' | \'' )}' )`,
    toStateObject: numberProperty => {
      return numberProperty.toStateObject();
    },
    applyState: ( numberProperty, stateObject ) => {
      // nothing to do here for range, because in order to support range, this NumberProperty's rangeProperty must be instrumented.

      PropertyIOImpl.applyState( numberProperty, stateObject );
    },
    stateSchema: {
      numberType: StringIO,
      range: NullableIO( Range.RangeIO ),
      rangePhetioID: NullableIO( StringIO ),
      value: NumberIO
    }
  } );
}

axon.register( 'NumberProperty', NumberProperty );
