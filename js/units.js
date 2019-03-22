// Copyright 2018, University of Colorado Boulder

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
      'amperes',
      'atmospheres',
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
      'kilopascals',
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
      'picoseconds',
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
      'webers',

      // abbreviations -- in time we will replace all full forms with abbreviations only
      // see https://github.com/phetsims/phet-io/issues/530
      'cm',
      'nm'
    ],

    isValidUnits: function( unit ) {
      return _.includes( units.values, unit );
    }
  };

  axon.register( 'units', units );

  return units;
} );