// Copyright 2022, University of Colorado Boulder

/**
 * A MappedProperty specialized for unit conversion. Just provide multiplicative factor to convert between the units,
 * or optionally a map/inverseMap. Additionally if there is a rangeProperty on the source, this Property will have a
 * mapped range.
 *
 * For example:
 * const metersProperty = new NumberProperty( 0.5, { range: new Range( 0, 1 ) } );
 * const centimetersProperty = new UnitConversionProperty( metersProperty, { factor: 100 } );
 * centimetersProperty.value; // 50
 * centimetersProperty.range; // Range( 0, 100 )
 *
 * // One way
 * metersProperty.value = 0.25
 * centimetersProperty.value; // 25
 *
 * // Bidirectional
 * centimetersProperty.value = 100;
 * metersProperty.value; // 1
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import Range from '../../dot/js/Range.js';
import TProperty from './TProperty.js';
import MappedProperty, { MappedPropertyOptions } from './MappedProperty.js';
import Property from './Property.js';
import NumberProperty, { DEFAULT_RANGE, RangedProperty } from './NumberProperty.js';
import optionize from '../../phet-core/js/optionize.js';

type SelfOptions = {
  // The multiplicative factor to convert from INPUT => OUTPUT, e.g.
  // this.value === factor * property.value
  // This will be used to provide defaults for map/inverseMap if provided
  factor: number;
};
type ParentOptions = MappedPropertyOptions<number, number>;
export type UnitConversionPropertyOptions = SelfOptions & ParentOptions;

export default class UnitConversionProperty extends MappedProperty<number, number> implements RangedProperty {

  public readonly rangeProperty: TProperty<Range>;

  private _property: TProperty<number>;
  private _rangeListener?: ( range: Range ) => void;

  public constructor( property: TProperty<number>, providedOptions: UnitConversionPropertyOptions ) {

    const map = ( input: number ) => input * providedOptions.factor;
    const inverseMap = ( output: number ) => output / providedOptions.factor;
    const options = optionize<UnitConversionPropertyOptions, SelfOptions, ParentOptions>()( {

      // Bidirectional by default, since we'll have a map and inverseMap guaranteed
      bidirectional: true,

      map: map,
      inverseMap: inverseMap
    }, providedOptions );

    // @ts-expect-error
    super( property, options );

    this._property = property;

    this.rangeProperty = new Property<Range>( DEFAULT_RANGE );

    // Watch the range of the target Property, and update ours to match
    if ( ( property as NumberProperty ).rangeProperty ) {
      this._rangeListener = ( range: Range ) => {
        const min = map( range.min );
        const max = map( range.max );
        // Handle a negative factor or something else where the min/max gets swapped
        this.rangeProperty.value = new Range( Math.min( min, max ), Math.max( min, max ) );
      };
      ( property as NumberProperty ).rangeProperty.link( this._rangeListener );
    }
  }

  public get range(): Range {
    return this.rangeProperty.value;
  }

  // NOTE: NOT bidirectional yet!
  public set range( value: Range ) {
    this.rangeProperty.value = value;
  }

  public override dispose(): void {
    if ( ( this._property as NumberProperty ).rangeProperty ) {
      ( this._property as NumberProperty ).rangeProperty.unlink( this._rangeListener! );
    }

    this.rangeProperty.dispose();
  }
}

axon.register( 'UnitConversionProperty', UnitConversionProperty );
