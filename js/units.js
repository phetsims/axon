// Copyright 2018-2019, University of Colorado Boulder

/**
 * These are the units that can be associated with Property instances.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );

  var units = {
    values: [

      // NOTE: Abbreviations are preferred, see https://github.com/phetsims/phet-io/issues/530
      'AMU', // atomic mass unit
      'atm', // atmospheres
      'cm', // centimeters
      '\u00B0C', // degrees Celsius
      'K', // Kelvin
      'kPa', // kilopascals
      'm', // meters
      'm/s',
      'nm', // nanometers
      'nm/ps',
      'particles/ps',
      'pm', // picometers
      'pm/ps',
      'ps', // picoseconds
      's', // seconds

      // NOTE: In time, these will be replaced with abbreviations, see above.
      'amperes',
      'milliamperes',
      'becquerels',
      'centimeters',
      'centimeters-squared',
      'coulombs',
      'degrees Celsius',
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
      'newtons',
      'newtons/meters',
      'newtons-second/meters',
      'ohms',
      'ohm-centimeters',
      'pascals',
      'percent',
      'radians',
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

  return units;
} );