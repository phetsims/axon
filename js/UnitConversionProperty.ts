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
import IProperty from './IProperty.js';
import MappedProperty, { MappedPropertyOptions } from './MappedProperty.js';
import TinyProperty from './TinyProperty.js';
import Property from './Property.js';
import merge from '../../phet-core/js/merge.js';
import NumberProperty, { isRangedProperty, RangedProperty } from './NumberProperty.js';

type UnitConversionPropertySelfOptions = {
  // The multiplicative factor to convert from INPUT => OUTPUT, e.g.
  // this.value === factor * property.value
  // This will be used to provide defaults for map/inverseMap if provided
  factor?: number;

  // Only support the numeric map/inverseMap
  map?: ( input: number ) => number;
  inverseMap?: ( output: number ) => number;
};
export type UnitConversionPropertyOptions = UnitConversionPropertySelfOptions & MappedPropertyOptions<number, number>;

export default class UnitConversionProperty extends MappedProperty<number, number> {

  readonly rangeProperty: IProperty<Range | null>;

  private _property: Property<number>;
  private _rangeListener?: ( range: Range | null ) => void;

  constructor( property: Property<number>, providedOptions: UnitConversionPropertyOptions ) {

    let options = merge( {
      // Bidirectional by default, since we'll have a map and inverseMap guaranteed
      bidirectional: true
    }, providedOptions );

    const factor = options.factor;
    if ( factor ) {
      options = merge( {
        map: ( input: number ) => input * factor,
        inverseMap: ( output: number ) => output / factor
      }, options );
    }
    const map = options.map as ( input: number ) => number;

    super( property, options );

    this._property = property;

    this.rangeProperty = new TinyProperty<Range | null>( null );

    // Watch the range of the target Property, and update ours to match
    if ( ( property as NumberProperty ).rangeProperty ) {
      this._rangeListener = ( range: Range | null ) => {
        if ( range === null ) {
          this.rangeProperty.value = null;
        }
        else {
          const min = map( range.min );
          const max = map( range.max );
          // Handle a negative factor or something else where the min/max gets swapped
          this.rangeProperty.value = new Range( Math.min( min, max ), Math.max( min, max ) );
        }
      };
      ( property as NumberProperty ).rangeProperty.link( this._rangeListener );
    }
  }

  get range(): Range | null {
    return this.rangeProperty.value;
  }

  // NOTE: NOT bidirectional yet!
  set range( value: Range | null ) {
    this.rangeProperty.value = value;
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

  dispose() {
    if ( ( this._property as NumberProperty ).rangeProperty ) {
      ( this._property as NumberProperty ).rangeProperty.unlink( this._rangeListener! );
    }

    this.rangeProperty.dispose();
  }
}

axon.register( 'UnitConversionProperty', UnitConversionProperty );
