// Copyright 2021-2022, University of Colorado Boulder

/**
 * QUnit tests for TinyForwardingProperty
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from './DerivedProperty.js';
import TinyForwardingProperty from './TinyForwardingProperty.js';
import TinyProperty from './TinyProperty.js';
import { Node } from '../../scenery/js/imports.js';
import Property from './Property.js';
import NumberProperty from './NumberProperty.js';

QUnit.module( 'TinyForwardingProperty' );

QUnit.test( 'Basics', assert => {

  const myForwardingProperty = new TinyForwardingProperty<number | boolean | string>( true, false );

  assert.ok( myForwardingProperty.get() === true, 'basic value for Property' );

  const myTinyProperty = new TinyProperty<number | boolean | string>( 'tinyProperty' );
  myForwardingProperty.setTargetProperty( new Node(), null, myTinyProperty );
  assert.ok( myForwardingProperty.get() === 'tinyProperty', 'should forward' );
  myTinyProperty.set( 'otherString' );
  assert.ok( myForwardingProperty.get() === 'otherString', 'should forward after set to TinyProperty' );


  const myProperty = new Property<number | boolean | string>( 0 );
  myForwardingProperty.setTargetProperty( new Node(), null, myProperty );
  assert.ok( myForwardingProperty.get() === 0, 'should forward after set to Property' );


  const x = new NumberProperty( 0 );
  const myDerivedProperty = new DerivedProperty( [ x ], value => value + 5 ); // plus 5!
  const myOtherForwardingProperty = new TinyForwardingProperty<number>( 0, false );

  // @ts-ignore
  myOtherForwardingProperty.setTargetProperty( new Node(), null, myDerivedProperty );
  assert.ok( myOtherForwardingProperty.get() === 5, 'should forward after set to DerivedProperty' );

  myProperty.value = 6;
  assert.ok( myOtherForwardingProperty.get() === 11, 'should forward after set to DerivedProperty after dependencies change' );
} );

QUnit.test( 'Forward to a TinyProperty', assert => {

  const myForwardingProperty = new TinyForwardingProperty<boolean | string>( true, false );

  const myTinyProperty = new TinyProperty<boolean | string>( 'hi' );

  myForwardingProperty.setTargetProperty( new Node(), null, myTinyProperty );

  assert.ok( myForwardingProperty.value === 'hi', 'forward to tinyProperty' );

  const otherTinyProperty = new TinyProperty<boolean | string>( 'seven' );

  myForwardingProperty.setTargetProperty( new Node(), null, otherTinyProperty );

  assert.ok( myForwardingProperty.value === 'seven', 'forward to other TinyProperty' );
} );