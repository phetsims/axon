// Copyright 2022, University of Colorado Boulder

/**
 * Similar to DerivedProperty, but restricted to one Property and provides value-mapped and bidirectional support.
 * It's basically a DynamicProperty where you don't need to wrap it in an additional Property, and is typed a bit easier
 *
 * For example:
 *
 * const stringProperty = new Property<string>( 'hello' );
 * const lengthProperty = new MappedProperty( stringProperty, {
 *   map: ( str: string ) => str.length
 * } );
 * lengthProperty.value; // 5
 * stringProperty.value = 'hi';
 * lengthProperty.value; // 2
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import KeysMatching from '../../phet-core/js/types/KeysMatching.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import axon from './axon.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import DynamicProperty, { DynamicPropertyOptions } from './DynamicProperty.js';
import TinyProperty from './TinyProperty.js';

type SelfOptions<ThisValueType, InputValueType> = {
  // If set to true then changes to this Property (if valuePropertyProperty.value is non-null at the time) will also be
  // made to valuePropertyProperty.value.
  bidirectional?: boolean;

  // Maps our input Property value to/from this Property's value. See top-level documentation for usage.
  // If it's a string, it will grab that named property out (e.g. it's like passing u => u[ derive ])
  map?: ( ( inputValue: InputValueType ) => ThisValueType ) | KeysMatching<InputValueType, ThisValueType>;
  inverseMap?: ( ( thisValue: ThisValueType ) => InputValueType ) | KeysMatching<ThisValueType, InputValueType>;
};

type SuperOptions<ThisValueType, InputValueType> = StrictOmit<DynamicPropertyOptions<ThisValueType, InputValueType, TReadOnlyProperty<InputValueType>>, 'defaultValue' | 'derive'>;

export type MappedPropertyOptions<ThisValueType, InputValueType> = SelfOptions<ThisValueType, InputValueType> & SuperOptions<ThisValueType, InputValueType>;

export default class MappedProperty<ThisValueType, InputValueType> extends DynamicProperty<ThisValueType, InputValueType, TReadOnlyProperty<InputValueType>> {
  public constructor( property: TReadOnlyProperty<InputValueType>, providedOptions?: MappedPropertyOptions<ThisValueType, InputValueType> ) {
    super( new TinyProperty( property ), providedOptions );
  }
}

axon.register( 'MappedProperty', MappedProperty );
