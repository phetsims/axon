// Copyright 2025, University of Colorado Boulder

/**
 * Representation of a Unit (e.g., meters, seconds, etc.) that can be used with Properties.
 *
 * This file is more of a type definition, PhetUnit (in scenery-phet) will be the main implementation of this.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import type { TReadOnlyProperty } from './TReadOnlyProperty.js';
import type ReadOnlyProperty from './ReadOnlyProperty.js';
import type { AccessibleValuePattern, DualString, FormattedNumberPropertyOptions, NumberFormatOptions } from './AccessibleStrings.js';

export type Unit = {
  // Basic "backwards-compatible" name, e.g. "m" or "m/s^2" (strings in axon/units.ts)
  name: string;

  // String Property for the "standalone" string (e.g. units with no value)
  visualSymbolStringProperty?: TReadOnlyProperty<string>;

  // Pattern for the visual "value + units" combination
  visualSymbolPatternStringProperty?: TReadOnlyProperty<string>;

  // Pattern for the accessible "value + units" combination
  accessiblePattern?: AccessibleValuePattern;

  // Get the current value/translation of the standalone string (units with no value).
  getVisualSymbolString(): string;

  // Get the current value/translation of the visual string (value + units).
  getVisualSymbolPatternString( value: number, providedOptions?: NumberFormatOptions ): string;

  // Get the current value/translation of the accessible string (value + units).
  getAccessibleString( value: number, providedOptions?: NumberFormatOptions ): string;

  // Get the current value/translation of the visual AND accessible string (value + units), as a DualString.
  getDualString( value: number, providedOptions?: NumberFormatOptions ): DualString;

  // Get the string Property for the standalone visual string (units with no value). e.g. "cm"
  getVisualSymbolStringProperty(): TReadOnlyProperty<string>;

  // Get a string Property for a visual string (value + units) based on a value Property. e.g. "15.0 cm"
  getVisualSymbolPatternStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): ReadOnlyProperty<string>;

  // Get a string Property for a accessible string (value + units) based on a value Property. e.g. "15.0 centimeters"
  getAccessibleStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): ReadOnlyProperty<string>;

  // Get an DualString Property for a visual + accessible string (value + units) based on a value Property.
  getDualStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): ReadOnlyProperty<DualString>;

  // Get a list of the dependent properties that this unit relies on.
  getDependentProperties(): TReadOnlyProperty<unknown>[];
};

// Convert a unit to a string - useful for phet-io
export const unitToString = ( unit: Unit | string ): string => {
  if ( typeof unit === 'string' ) {
    return unit;
  }
  else {
    return unit.name;
  }
};

// Convert a unit (or null) to a string (or null) - useful for phet-io
export const unitToStringOrNull = ( unit: Unit | string | null ): string | null => {
  return unit === null ? null : unitToString( unit );
};