// Copyright 2016-2023, University of Colorado Boulder

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
import ReadOnlyProperty from './ReadOnlyProperty.js';
import Property, { PropertyOptions } from './Property.js';
import validate from './validate.js';
import TRangedProperty from './TRangedProperty.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';

const VALID_INTEGER = { valueType: 'number', isValidValue: ( v: number ) => v % 1 === 0, validationMessage: 'Should be a valid integer' };
const VALID_NON_NAN = { isValidValue: ( v: number ) => !isNaN( v ), validationMessage: 'Should not be NaN' };
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// valid values for options.numberType to convey whether it is continuous or discrete with step size 1
const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ] as const;
type NumberType = typeof VALID_NUMBER_TYPES[number];

// standardized tandem name for rangeProperty
const RANGE_PROPERTY_TANDEM_NAME = 'rangeProperty';

export const DEFAULT_RANGE = Range.EVERYTHING;

export type NumberPropertyState = {
  numberType: string;
  range: RangeStateObject;
  rangePhetioID: string | null;
} & ReadOnlyProperty<number>;

// For the IOType
const PropertyIOImpl = Property.PropertyIO( NumberIO );

type SelfOptions = {
  numberType?: NumberType;
  range?: Range | Property<Range>;

  // Passed to this.rangeProperty if NumberProperty creates it. Ignored if a Property is provided via options.range.
  rangePropertyOptions?: PropertyOptions<Range>;
};

export type NumberPropertyOptions = SelfOptions & StrictOmit<PropertyOptions<number>, 'phetioValueType' | 'valueType'>;

export default class NumberProperty extends Property<number> implements TRangedProperty {

  // Used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
  // @readonly, but cannot set as such because it is set by PhET-iO state.
  private readonly numberType: NumberType;

  // validation for NumberProperty and its rangeProperty, undefined if assertions are disabled
  private readonly validateNumberAndRangeProperty: ( ( value: number ) => void ) | undefined;

  public readonly rangeProperty: Property<Range>;
  private readonly disposeNumberProperty: () => void;
  private readonly resetNumberProperty: () => void;

  public constructor( value: number, providedOptions?: NumberPropertyOptions ) {

    // Please feel free to remove this if you have a reasonable case!
    assert && providedOptions && assertMutuallyExclusiveOptions( [ 'range' ], [ 'validValues' ] );

    const options = optionize<NumberPropertyOptions, StrictOmit<SelfOptions, 'rangePropertyOptions'>, PropertyOptions<number>>()( {

      // NumberPropertyOptions
      numberType: 'FloatingPoint',
      range: DEFAULT_RANGE,

      // PropertyOptions
      validators: [],
      tandem: Tandem.OPTIONAL,

      phetioOuterType: () => NumberProperty.NumberPropertyIO
    }, providedOptions );

    options.rangePropertyOptions = optionize<PropertyOptions<Range>, EmptySelfOptions, PropertyOptions<Range>>()( {
      phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
      phetioValueType: Range.RangeIO,
      phetioReadOnly: true,

      // If provided range is the default, don't instrument the PhET-iO RangeProperty
      tandem: options.range !== DEFAULT_RANGE ? options.tandem.createTandem( RANGE_PROPERTY_TANDEM_NAME ) : Tandem.OPT_OUT
    }, options.rangePropertyOptions );

    if ( assert && Tandem.VALIDATION && options.rangePropertyOptions.tandem && options.rangePropertyOptions.tandem.supplied ) {
      assert && assert( options.rangePropertyOptions.tandem.name === RANGE_PROPERTY_TANDEM_NAME,
        `rangePropertyOptions.tandem.name must be ${RANGE_PROPERTY_TANDEM_NAME}: ${options.rangePropertyOptions.tandem.name}` );
    }

    // client cannot specify superclass options that are controlled by NumberProperty
    options.valueType = 'number';
    options.phetioValueType = NumberIO; // not actually used, but for completeness, don't have ReadOnlyProperty storing the wrong default.

    const rangePropertyProvided = options.range && options.range instanceof ReadOnlyProperty;
    const ownsRangeProperty = !rangePropertyProvided;

    const rangeProperty = options.range instanceof ReadOnlyProperty ? options.range : new Property( options.range, options.rangePropertyOptions );

    options.validators.push( VALID_NON_NAN ); // seems right for this to run first
    if ( options.numberType === 'Integer' ) {
      options.validators.push( VALID_INTEGER );
    }
    options.validators.push( {
      isValidValue: v => rangeProperty.value.contains( v ),
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

  public get range(): Range {
    return this.rangeProperty.value;
  }

  /**
   * Convenience function for setting the rangeProperty. Note: be careful using this function, as validation will occur
   * immediately, and if the value is outside of this new Range an error will occur. See this.setValueAndRange() for
   *  way to set both at once without assertion errors.
   */
  public set range( range: Range ) {
    this.rangeProperty.value = range;
  }

  public override reset(): void {
    this.resetValueAndRange(); // even if we don't own the range, reset them together to prevent assertions, https://github.com/phetsims/axon/issues/427
    super.reset();
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
    this.setValueAndRange( this.initialValue, this.rangeProperty.initialValue );
  }

  /**
   * Get parent state and append NumberProperty-specific metadata to it.
   */
  public toStateObject(): NumberPropertyState {
    const parentStateObject = PropertyIOImpl.toStateObject( this );

    parentStateObject.numberType = this.numberType;
    parentStateObject.range = Range.RangeIO.toStateObject( this.rangeProperty.value );

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
      range: Range.RangeIO,
      rangePhetioID: NullableIO( StringIO ),
      value: NumberIO
    }
  } );
}

axon.register( 'NumberProperty', NumberProperty );
