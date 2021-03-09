// Copyright 2018-2020, University of Colorado Boulder

/**
 * These are the units that can be associated with Property instances.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';

const units = {
  values: [

    // NOTE: Abbreviations are preferred, see https://github.com/phetsims/phet-io/issues/530
    '%', // percent
    'AMU', // atomic mass unit
    'atm', // atmospheres
    'cm', // centimeters
    '\u00B0C', // degrees Celsius
    'g', // grams
    'K', // Kelvin
    'kg', // kilograms
    'kg/m^3', // kg/cubic meter
    'kPa', // kilopascals
    'L',
    'L/s',
    'm', // meters
    'm/s', // meters/second
    'm/s^2', // meters/seconds squared
    'mm', //millimeters
    'mol',
    'mol/L',
    'N', // Newtons
    'nm', // nanometers
    'nm/ps', // nanometers/picosecond
    '\u2126', // ohms, don't use the one in MathSymbols to prevent a dependency on scenery-phet
    'particles/ps', // particles/picosecond
    'pm', // picometers
    'pm/ps', // picometers/picosecond
    'pm/s', // picometers/second
    'pm/s^2', // picometers/second squared
    'pm^3', // picometers cubed
    'ps', // picoseconds
    'radians', // radians, note this has the same abbreviation as the radiation term "rad" so we use the full term
    's', // seconds

    //TODO https://github.com/phetsims/axon/issues/345 replace these with abbreviations
    // @deprecated the units below here should not be used in new code, and should be replaced with abbreviations
    'amperes',
    'becquerels',
    'centimeters',
    'centimeters-squared',
    'coulombs',
    'degrees',
    'degrees Celsius',
    'farads',
    'grams',
    'gray',
    'henries',
    'henrys',
    'hertz',
    'joules',
    'katals',
    'kelvins',
    'kilograms',
    'liters',
    'liters/second',
    'lumens',
    'lux',
    'meters',
    'meters/second',
    'meters/second/second',
    'milliamperes',
    'moles',
    'moles/liter',
    'nanometers',
    'newtons/meters',
    'newtons-second/meters',
    'ohm-centimeters',
    'ohms',
    'pascals',
    'percent',
    'radians/second',
    'seconds',
    'siemens',
    'sieverts',
    'steradians',
    'tesla',
    'view-coordinates/second',
    'volts',
    'watts',
    'webers'
  ],

  isValidUnits: function( unit ) {
    return _.includes( units.values, unit );
  }
};

axon.register( 'units', units );

export default units;