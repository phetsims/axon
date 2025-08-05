// Copyright 2018-2025, University of Colorado Boulder

/**
 * Representation of a Unit (e.g., meters, seconds, etc.) that can be used with Properties.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import FluentPattern, { FluentVariable } from '../../chipper/js/browser/FluentPattern.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import { DerivedPropertyOptions } from './DerivedProperty.js';

export type AccessibleString = {
  visualString: string;
  spokenString: string;
};

export type NumberFormatOptions = {
  // The number of decimal places to use for the value, or null (for all of the decimal places)
  decimalPlaces?: number | null;

  // Whether to show trailing zeros in the decimal part of the value (a zero with no non-zero value after it)
  showTrailingZeros?: boolean;

  // Whether to show integers without a decimal point (e.g., 5 instead of 5.0)
  showIntegersAsIntegers?: boolean;

  // Whether to use scientific notation for large/small values
  useScientificNotation?: boolean;

  // The base to use for scientific notation (default is 10, but could be 2 or others)
  scientificBase?: number;

  // Whether to replace the minus sign with the word "negative" (e.g., -5 becomes "negative 5")
  replaceMinusWithNegative?: boolean;
};

export type FormattedNumberPropertyOptions<T> = {
  numberFormatOptions?: NumberFormatOptions;
} & DerivedPropertyOptions<T>;

export const DEFAULT_FORMATTED_NUMBER_VISUAL_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: true,
  showIntegersAsIntegers: false,
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false
};

export const DEFAULT_FORMATTED_NUMBER_SPOKEN_OPTIONS: Required<NumberFormatOptions> = {
  decimalPlaces: null,
  showTrailingZeros: false,
  showIntegersAsIntegers: true,
  useScientificNotation: false,
  scientificBase: 10,
  replaceMinusWithNegative: false
};

export type Unit = {
  name: string;

  // String Property for the "standalone" string (e.g. units with no value)
  visualStandaloneStringProperty?: TReadOnlyProperty<string>;

  // Pattern for the visual "value + units" combination
  visualPattern?: FluentPattern<{ value: FluentVariable }>;

  // Pattern for the spoken "value + units" combination
  spokenPattern?: FluentPattern<{ value: FluentVariable }>;

  hasVisualStandaloneString: boolean;
  hasVisualString: boolean;
  hasSpokenString: boolean;

  // Get the current value/translation of the standalone string (units with no value).
  getVisualStandaloneString(): string;

  // Get the current value/translation of the visual string (value + units).
  getVisualString( value: number, providedOptions?: NumberFormatOptions ): string;

  // Get the current value/translation of the spoken string (value + units).
  getSpokenString( value: number, providedOptions?: NumberFormatOptions ): string;

  getAccessibleString( value: number, providedOptions?: NumberFormatOptions ): AccessibleString;
  getVisualStandaloneStringProperty(): TReadOnlyProperty<string>;
  getVisualStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): TReadOnlyProperty<string>;
  getSpokenStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): TReadOnlyProperty<string>;
  getAccessibleStringProperty(
    valueProperty: TReadOnlyProperty<number>,
    providedOptions?: FormattedNumberPropertyOptions<string>
  ): TReadOnlyProperty<AccessibleString>;
};