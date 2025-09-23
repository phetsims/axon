// Copyright 2025, University of Colorado Boulder

/**
 * Types and utilities for accessible strings (including number formatting).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ReadOnlyProperty from './ReadOnlyProperty.js';
import { DerivedPropertyOptions } from './DerivedProperty.js';
import FluentPattern, { FluentVariable } from '../../chipper/js/browser/FluentPattern.js';
import { TReadOnlyProperty } from './TReadOnlyProperty.js';

// Combined visual and accessible string, usable by controls that handle units, or for other purposes.
// This is needed by types like NumberDisplay/PhetUnit, where we have both a visual string (for display) and
// an accessible string (for screen readers), and we want to carry them around together.
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

// Our classic "value" pattern (e.g. "{{value}} cm"), but with Fluent support (so we can do proper pluralization).
export type AccessibleValuePattern = FluentPattern<{ value: FluentVariable }>;

// A type for "input" to a component when it should have both a visual and accessible "value pattern".
export type DualValuePattern = {
  visualPattern: string | TReadOnlyProperty<string>;
  accessiblePattern: AccessibleValuePattern;
};

// Similar to above, but for when a Property is required for the pattern (for internal use in components)
export type DualValuePropertyPattern = {
  visualPatternProperty: ReadOnlyProperty<string>;
  accessiblePattern: AccessibleValuePattern | null;
};

// Options for getFormattedNumber (here, because the options are needed by the Unit definition, but the implementation
// is in scenery-phet due to its use of scenery-phet strings).
export type NumberFormatOptions = {
  // The number of decimal places to use for the value, or null (for all of the decimal places)
  //
  // e.g. for 15.14052, decimalPlaces = 2 would result in "15.14"
  // If decimalPlaces is null, it will use the full precision of the number.
  // If decimalPlaces is set to 0, it will show the number as an integer
  // (e.g., 15.14052 would become "15" with decimalPlaces: 0)
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

// Defaults for "visual" form of number formatting (e.g. for visual strings)
export const DEFAULT_FORMATTED_NUMBER_VISUAL_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: true, // We usually want fixed decimal places in visual strings
  showIntegersAsIntegers: false, // We usually want fixed decimal places in visual strings
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false,
  wrapLTR: true // helps with embedding in RTL strings
};

// Defaults for "accessible" form of number formatting (e.g. for screen readers)
export const DEFAULT_FORMATTED_NUMBER_ACCESSIBLE_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: true,
  showIntegersAsIntegers: false,
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false,
  wrapLTR: false
};