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