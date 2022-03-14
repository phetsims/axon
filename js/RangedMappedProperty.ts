// Copyright 2022, University of Colorado Boulder

/**
 * A MappedProperty, but with a required Range (to type as a RangedProperty for where required).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import Range from '../../dot/js/Range.js';
import IProperty from './IProperty.js';
import MappedProperty, { MappedPropertyOptions } from './MappedProperty.js';
import { RangedProperty } from './NumberProperty.js';
import TinyProperty from './TinyProperty.js';
import Property from './Property.js';

type RangedMappedPropertySelfOptions = { range: Range };
export type RangedMappedPropertyOptions = RangedMappedPropertySelfOptions & MappedPropertyOptions<number, number>;

export default class RangedMappedProperty extends MappedProperty<number, number> implements RangedProperty {

  range: Range;
  readonly rangeProperty: IProperty<Range>;

  constructor( property: Property<number>, providedOptions: RangedMappedPropertyOptions ) {
    super( property, providedOptions );

    this.range = providedOptions.range;
    this.rangeProperty = new TinyProperty( providedOptions.range );
  }
}

axon.register( 'RangedMappedProperty', RangedMappedProperty );
