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
    'AMU', // atomic mass unit
    'atm', // atmospheres
    'cm', // centimeters
    '\u00B0C', // degrees Celsius
    'K', // Kelvin
    'kg', // kilograms
    'kg/m^3', // kg/cubic meter
    'kPa', // kilopascals
    'm', // meters
    'mm', //millimeters
    'm/s', // meters/second
    'm/s^2', // meters/seconds squared
    'nm', // nanometers
    'nm/ps', // nanometers/picosecond
    '\u2126', // ohms, don't use the one in MathSymbols to prevent a dependency on scenery-phet
    'particles/ps', // particles/picosecond
    'pm', // picometers
    'pm/s', // picometers/second
    'pm/s^2', // picometers/second squared
    'pm/ps', // picometers/picosecond
    'pm^3', // picometers cubed
    'ps', // picoseconds
    's', // seconds
    'N', // Newtons
    'radians', // radians, note this has the same abbreviation as the radiation term "rad" so we use the full term
    'L/s',
    'L',
    'mol/L',
    'mol',

    // NOTE: In time, these will be replaced with abbreviations, see above.
    'amperes',
    'milliamperes',
    'becquerels',
    'centimeters',
    'centimeters-squared',
    'coulombs',
    'degrees Celsius',
    'degrees',
    'farads',
    'kilograms',
    'grams',
    'gray',
    'henrys',
    'henries',
    'hertz',
    'joules',
    'katals',
    'kelvins',
    'liters',
    'liters/second',
    'lumens',
    'lux',
    'meters',
    'meters/second',
    'meters/second/second',
    'moles',
    'moles/liter',
    'nanometers',
    'newtons/meters',
    'newtons-second/meters',
    'ohms',
    'ohm-centimeters',
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