// Copyright 2025, University of Colorado Boulder

/**
 * Representation of a Unit (e.g., meters, seconds, etc.) that can be used with Properties.
 *
 * This file is more of a type definition, PhetUnit (in scenery-phet) will be the main implementation of this.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import FluentPattern, { FluentVariable } from '../../chipper/js/browser/FluentPattern.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import { DerivedPropertyOptions } from './DerivedProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';

// Combined visual and accessible string, usable by controls that handle units, or for other purposes.
export type DualString = {
  visualString: string;
  accessibleString: string;
};

// Similar to DualString, but allows numbers (for when it is ideal to pass a number to a FluentPattern, so it can adjust
// pluralization).
export type DualStringNumber = {
  visualString: string | number;
  accessibleString: string | number;
};

export type AccessibleValuePattern = FluentPattern<{ value: FluentVariable }>;

export type DualValuePattern = {
  visualPattern: string | TReadOnlyProperty<string>;
  accessiblePattern: AccessibleValuePattern;
};

// Similar to above, but for when a Property is required for the pattern (for internal use in components)
export type DualValuePropertyPattern = {
  visualPatternProperty: ReadOnlyProperty<string>;
  accessiblePattern: AccessibleValuePattern | null;
};

export type NumberFormatOptions = {
  // The number of decimal places to use for the value, or null (for all of the decimal places)
  //
  // e.g. for 15.14052, decimalPlaces = 2 would result in "15.14"
  // If decimalPlaces is null, it will use the full precision of the number.
  // If decimalPlaces is set to 0, it will show the number as an integer
  // (e.g., 15.14052 would become "15" if decimalPlaces
  decimalPlaces?: number | null;

  // Whether to show trailing zeros in the decimal part of the value (a zero with no non-zero value after it)
  // e.g., for 15.14052 rounding to 3 decimal places, showTrailingZeros = true would result in "15.140",
  // but false would result in "15.14"
  showTrailingZeros?: boolean;

  // Whether to show integers without a decimal point (e.g., 5 instead of 5.0), EVEN IF showTrailingZeros is true.
  // This is useful for cases where non-integers should have a fixed number of decimal places, but integers
  // can be shown without a decimal point.
  showIntegersAsIntegers?: boolean;

  // Whether to use scientific notation.
  // e.g., for 15000, useScientificNotation = true would result in "1.5 × 10<sup>4</sup>"
  useScientificNotation?: boolean;

  // The base to use for scientific notation (default is 10, but could be 2 or others)
  scientificBase?: number;

  // Whether to replace the minus sign with the word "negative" (e.g., -5 becomes "negative 5")
  replaceMinusWithNegative?: boolean;

  // If true, it will wrap with Unicode embedding marks to ensure the number displays correctly visually when embedded
  // in RTL strings.
  // NOTE: Since this turns it into a string, it won't work for FluentPattern input where correct pluralization is needed.
  wrapLTR?: boolean;
};

export type FormattedNumberPropertyOptions<T> = {
  numberFormatOptions?: NumberFormatOptions;
} & DerivedPropertyOptions<T>;

export const DEFAULT_FORMATTED_NUMBER_VISUAL_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: true, // We usually want fixed decimal places in visual strings
  showIntegersAsIntegers: false, // We usually want fixed decimal places in visual strings
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false,
  wrapLTR: true
};

export const DEFAULT_FORMATTED_NUMBER_SPOKEN_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: false,
  showIntegersAsIntegers: true,
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false,
  wrapLTR: false
};

export type Unit = {
  // Basic "backwards-compatible" name, e.g. "m" or "m/s^2"
  name: string;

  // String Property for the "standalone" string (e.g. units with no value)
  visualStandaloneStringProperty?: TReadOnlyProperty<string>;

  // Pattern for the visual "value + units" combination
  visualPatternStringProperty?: TReadOnlyProperty<string>;

  // Pattern for the accessible "value + units" combination
  accessiblePattern?: AccessibleValuePattern;

  // Whether there is support for different types of string output.
  hasVisualStandaloneString: boolean;
  hasVisualString: boolean;
  hasAccessibleString: boolean;

  // Get the current value/translation of the standalone string (units with no value).
  getVisualStandaloneString(): string;

  // Get the current value/translation of the visual string (value + units).
  getVisualString( value: number, providedOptions?: NumberFormatOptions ): string;

  // Get the current value/translation of the accessible string (value + units).
  getAccessibleString( value: number, providedOptions?: NumberFormatOptions ): string;

  // Get the current value/translation of the visual AND accessible string (value + units), as a DualString.
  getDualString( value: number, providedOptions?: NumberFormatOptions ): DualString;

  // Get the string Property for the standalone visual string (units with no value). e.g. "cm"
  getVisualStandaloneStringProperty(): TReadOnlyProperty<string>;

  // Get a string Property for a visual string (value + units) based on a value Property. e.g. "15.0 cm"
  getVisualStringProperty(
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

export const unitToString = ( unit: Unit | string ): string => {
  if ( typeof unit === 'string' ) {
    return unit;
  }
  else {
    return unit.name;
  }
};

export const unitToStringOrNull = ( unit: Unit | string | null ): string | null => {
  return unit === null ? null : unitToString( unit );
};