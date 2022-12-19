// Copyright 2018-2022, University of Colorado Boulder

/**
 * These are the units that can be associated with Property instances.
 *
 * When adding units to this file, please add abbreviations, preferably SI abbreviations.
 * And keep the array alphabetized by value.
 * See https://github.com/phetsims/phet-io/issues/530
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';

const units = {
  values: [
    '1/(cm*M)', // molar absorptivity
    '%', // percent
    'A', // amperes
    'AMU', // atomic mass unit
    'atm', // atmospheres
    'cm', // centimeters
    'cm^2', // centimeters squared
    'C', // coulombs
    '\u00B0', // °, degrees (angle)
    '\u00B0C', // °C, degrees Celsius
    'F', // farad
    'g', // grams
    'Hz', // hertz
    'J', // Joules
    'K', // Kelvin
    'kg', // kilograms
    'kg/m^3', // kg/cubic meter
    'kg\u00b7m/s', // kg·m/s, kilogram-meters/second
    'kPa', // kilopascals
    'L',
    'L/s',
    'm', // meters
    'm^3', // cubic meter
    'm/s', // meters/second
    'm/s/s', // meters/second/second
    'm/s^2', // meters/seconds squared
    'mA', // milliampere
    'mm', //millimeters
    'mol',
    'mol/L',
    'mol/s',
    'M', // molar
    'N', // Newtons
    'N/m', // Newtons/meter
    'nm', // nanometers
    'nm/ps', // nanometers/picosecond
    'N\u00b7s/m', // N·s/m, Newton-seconds/meter
    '\u2126', // Ω, ohms - don't use the one in MathSymbols to prevent a dependency on scenery-phet
    '\u2126\u00b7cm', // Ω·cm, ohm-centimeters
    'Pa\u00b7s', // Pascal-seconds
    'particles/ps', // particles/picosecond
    'pm', // picometers
    'pm/ps', // picometers/picosecond
    'pm/s', // picometers/second
    'pm/s^2', // picometers/second-squared
    'pm^3', // picometers cubed
    'ps', // picoseconds
    'radians', // radians - note this has the same abbreviation as the radiation term "rad" so we use the full term
    'radians/s', // radians/second
    's', // seconds
    'V', // volts
    'view-coordinates/s',
    'W' // watts
  ],

  isValidUnits: function( unit: string ): boolean {
    return _.includes( units.values, unit );
  }
};

axon.register( 'units', units );

export default units;