// Copyright 2025, University of Colorado Boulder

/**
 * A numeric DynamicProperty with a range (like NumberProperty).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import axon from './axon.js';
import DynamicProperty, { DynamicPropertyOptions, TNullableProperty } from './DynamicProperty.js';
import Property, { type PropertyOptions } from './Property.js';
import Range from '../../dot/js/Range.js';
import TRangedProperty from './TRangedProperty.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';
import { DEFAULT_RANGE, RANGE_PROPERTY_TANDEM_NAME } from './NumberProperty.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import Tandem from '../../tandem/js/Tandem.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import validate from './validate.js';

type SelfOptions = {
  range?: Range | Property<Range>;

  // Passed to this.rangeProperty if NumberProperty creates it. Ignored if a Property is provided via options.range.
  rangePropertyOptions?: PropertyOptions<Range>;
};

export type RangedDynamicPropertyOptions<InnerValueType, OuterValueType> = SelfOptions & DynamicPropertyOptions<number, InnerValueType, OuterValueType>;

export default class RangedDynamicProperty<InnerValueType, OuterValueType> extends DynamicProperty<number, InnerValueType, OuterValueType> implements TRangedProperty {

  // validation for NumberProperty and its rangeProperty, undefined if assertions are disabled
  private readonly validateNumberAndRangeProperty: ( ( value: number ) => void ) | undefined;

  public readonly rangeProperty: Property<Range>;

  private readonly disposeRangedDynamicProperty: () => void;

  public constructor(
    valuePropertyProperty: TNullableProperty<OuterValueType> | TReadOnlyProperty<OuterValueType>,
    providedOptions?: RangedDynamicPropertyOptions<InnerValueType, OuterValueType>
  ) {

    // Including the StrictOmit for rangePropertyOptions similarly to NumberProperty
    const options = optionize<RangedDynamicPropertyOptions<InnerValueType, OuterValueType>, StrictOmit<SelfOptions, 'rangePropertyOptions'>, DynamicPropertyOptions<number, InnerValueType, OuterValueType>>()( {
      range: DEFAULT_RANGE
    }, providedOptions );

    options.rangePropertyOptions = optionize<PropertyOptions<Range>, EmptySelfOptions, PropertyOptions<Range>>()( {
      phetioDocumentation: 'Provides the range of possible values for the parent NumberPropertyIO',
      phetioValueType: Range.RangeIO,
      phetioReadOnly: true,

      // If provided range is the default, don't instrument the PhET-iO RangeProperty
      tandem: options.range !== DEFAULT_RANGE ? options.tandem?.createTandem( RANGE_PROPERTY_TANDEM_NAME ) : Tandem.OPT_OUT
    }, options.rangePropertyOptions );

    if ( assert && Tandem.VALIDATION && options.rangePropertyOptions.tandem && options.rangePropertyOptions.tandem.supplied ) {
      assert && assert( options.rangePropertyOptions.tandem.name === RANGE_PROPERTY_TANDEM_NAME,
        `rangePropertyOptions.tandem.name must be ${RANGE_PROPERTY_TANDEM_NAME}: ${options.rangePropertyOptions.tandem.name}` );
    }

    const rangePropertyProvided = options.range && options.range instanceof ReadOnlyProperty;
    const ownsRangeProperty = !rangePropertyProvided;

    const rangeProperty = options.range instanceof ReadOnlyProperty ? options.range : new Property( options.range, options.rangePropertyOptions );

    super( valuePropertyProperty, options );

    this.rangeProperty = rangeProperty;

    if ( assert && Tandem.VALIDATION && this.rangeProperty.isPhetioInstrumented() ) {
      assert && assert( this.isPhetioInstrumented(), 'NumberProperty must be phet-io instrumented if the range is' );
    }

    const rangePropertyObserver = () => {
      validate( this.value, this.valueValidator, { validateValidator: false } );
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

    this.disposeRangedDynamicProperty = () => {
      if ( ownsRangeProperty ) {
        this.rangeProperty.dispose();
      }
      else if ( assert ) {
        this.rangeProperty.unlink( rangePropertyObserver );
      }
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

  public override dispose(): void {
    this.disposeRangedDynamicProperty();
    super.dispose();
  }
}

axon.register( 'RangedDynamicProperty', RangedDynamicProperty );