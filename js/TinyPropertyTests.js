// Copyright 2020, University of Colorado Boulder

/**
 * QUnit tests for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import TinyProperty from './TinyProperty.js';

QUnit.module( 'TinyProperty' );

QUnit.test( 'TinyProperty Basics', assert => {
  const property = new TinyProperty( 'x' );
  property.link( value => {
    console.log( value );
  } );

  assert.ok( true, 'one test' );
} );