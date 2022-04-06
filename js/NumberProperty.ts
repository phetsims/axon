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
import stepTimer from './stepTimer.js';
import validate from './validate.js';
import ValidatorDef from './ValidatorDef.js';

// constants
const VALID_INTEGER = { valueType: 'number', isValidValue: ( v: number ) => v % 1 === 0 };
const VALID_RANGE_TYPE = { isValidValue: ( value: any ) => ( value instanceof Range || value === null ) };

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

  // By default, listeners are added to this Property and its provided rangeProperty to validate each
  // time either is set, making sure the NumberProperty value is within the Range. In certain cases, it is best
  // to defer this validation for a frame to allow these to go through an incorrect intermediate state, knowing
  // that by the next frame they will be correct. This is for usages that don't have the ability to set both the
  // number and range at the same time using NumberProperty.setValueAndRange.
  validateOnNextFrame?: boolean;
};

export type NumberPropertyOptions = SelfOptions & Omit<PropertyOptions<number>, 'phetioType'>;

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

  // if true, validation will be deferred until the next frame so that the number and range can be changed independently.
  private readonly validateOnNextFrame: boolean;

  // validation for NumberProperty and its rangeProperty, undefined if assertions are disabled
  private readonly validateNumberAndRangeProperty: ( ( value: any ) => void ) | undefined;

  // Public only for (NumberPropertyTests) - only applicable if options.validateOnNextFrame. Store the timeout so we
  // only need to create it once per frame.
  public validationTimeout: ( ( dt: number ) => void ) | null;
  readonly rangeProperty: Property<Range | null>;
  private readonly disposeNumberProperty: () => void;
  static NumberPropertyIO: IOType;
  private readonly resetNumberProperty: () => void;

  constructor( value: number, providedOptions?: NumberPropertyOptions ) {

    let options = optionize<NumberPropertyOptions, SelfOptions, PropertyOptions<number>, 'tandem'>( {
      numberType: 'FloatingPoint',
      range: null,

      // By default, this is not PhET-iO instrumented, if desired, pass a tandem through these options with name "rangeProperty"
      rangePropertyOptions: {
        phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
        phetioType: Property.PropertyIO( NullableIO( Range.RangeIO ) ),
        phetioReadOnly: true
      },

      validateOnNextFrame: false,

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
    assert && assert( !options.valueType, 'NumberProperty sets valueType' );
    options.valueType = 'number';

    options.phetioType = NumberProperty.NumberPropertyIO;

    const rangePropertyProvided = options.range && options.range instanceof Property;
    const ownsRangeProperty = !rangePropertyProvided;

    super( value, options );

    this.numberType = options.numberType;
    this.validateOnNextFrame = options.validateOnNextFrame;
    this.validateNumberAndRangeProperty = assert && ( value => {

      // validate that the number is correct
      assert && assert( this.isValueValid( value ) );

      // validate range value type
      validate( this.rangeProperty.value, VALID_RANGE_TYPE );
    } );

    this.validationTimeout = null;

    if ( options.range instanceof Property ) {
      this.rangeProperty = options.range;
    }
    else {
      this.rangeProperty = new Property( options.range, options.rangePropertyOptions );
    }

    assert && assert( this.rangeProperty instanceof Property, 'this.rangeProperty should be a Property' );
    assert && Tandem.VALIDATION && this.isPhetioInstrumented() && assert( this.rangeProperty.isPhetioInstrumented(),
      'rangeProperty must be instrument if NumberProperty is instrumented' );

    const rangePropertyObserver = () => {
      this.validateNumberAndRangeProperty && this.validateNumberProperty();
    };
    this.rangeProperty.link( rangePropertyObserver );

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

    // This puts validation at notification time instead of at value setting time. This is especially helpful as it
    // pertains to Property.prototype.setDeferred(), and setting a range and value together.
    this.validateNumberAndRangeProperty && this.link( value => this.validateNumberProperty() );

    this.disposeNumberProperty = () => {
      if ( ownsRangeProperty ) {
        this.rangeProperty.dispose();
      }
      else {
        this.rangeProperty.unlink( rangePropertyObserver );
      }

      if ( this.validationTimeout ) {
        stepTimer.clearTimeout( this.validationTimeout! );
        this.validationTimeout = null;
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

  /**
   * Trigger validation of this NumberProperty's value as it pertains to its provided range.
   */
  private validateNumberProperty(): void {
    if ( this.validateNumberAndRangeProperty ) {
      if ( this.validateOnNextFrame ) {

        // We only need this once, it will get the most recent value for both the value and range
        if ( !this.validationTimeout ) {
          this.validationTimeout = stepTimer.setTimeout( () => {
            this.validateNumberAndRangeProperty!( this.value );
            this.validationTimeout = null;
          }, 0 );
        }
      }
      else {
        this.validateNumberAndRangeProperty( this.value );
      }
    }
  }

  // Add NumberProperty-specific validation to the isValueValid function
  override isValueValid( value: number ): boolean {

    // validate for integer
    if ( this.numberType === 'Integer' && !ValidatorDef.isValueValid( value, VALID_INTEGER ) ) {
      return false;
    }

    // validate that value and range are compatible
    if ( this.rangeProperty.value && !this.rangeProperty.value.contains( value ) ) {
      return false;
    }
    return super.isValueValid( value );
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
