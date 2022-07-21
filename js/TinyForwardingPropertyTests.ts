// Copyright 2021, University of Colorado Boulder

/**
 * QUnit tests for TinyForwardingProperty
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from './DerivedProperty.js';
import NumberProperty from './NumberProperty.js';
import TinyForwardingProperty from './TinyForwardingProperty.js';
import TinyProperty from './TinyProperty.js';

QUnit.module( 'TinyForwardingProperty' );

QUnit.test( 'Basics', assert => {

  const myForwardingProperty = new TinyForwardingProperty( true, false );

  assert.ok( myForwardingProperty.get() === true, 'basic value for Property' );

  const myTinyProperty = new TinyProperty( 'tinyProperty' );
  myForwardingProperty.setTargetProperty( null, null, myTinyProperty );
  assert.ok( myForwardingProperty.get() === 'tinyProperty', 'should forward' );
  myTinyProperty.set( 'otherString' );
  assert.ok( myForwardingProperty.get() === 'otherString', 'should forward after set to TinyProperty' );


  const myProperty = new NumberProperty( 0 );
  myForwardingProperty.setTargetProperty( null, null, myProperty );
  assert.ok( myForwardingProperty.get() === 0, 'should forward after set to Property' );


  const myDerivedProperty = new DerivedProperty( [ myProperty ], value => value + 5 ); // plus 5!
  myForwardingProperty.setTargetProperty( null, null, myDerivedProperty );
  assert.ok( myForwardingProperty.get() === 5, 'should forward after set to DerivedProperty' );

  myProperty.value = 6;
  assert.ok( myForwardingProperty.get() === 11, 'should forward after set to DerivedProperty after dependencies change' );
} );

QUnit.test( 'Forward to a TinyProperty', assert => {

  const myForwardingProperty = new TinyForwardingProperty( true, false );

  const myTinyProperty = new TinyProperty( 'hi' );

  myForwardingProperty.setTargetProperty( null, null, myTinyProperty );

  assert.ok( myForwardingProperty.value === 'hi', 'forward to tinyProperty' );

  const otherTinyProperty = new TinyProperty( 'seven' );

  myForwardingProperty.setTargetProperty( null, null, otherTinyProperty );

  assert.ok( myForwardingProperty.value === 'seven', 'forward to other TinyProperty' );
} );