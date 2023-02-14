// Copyright 2021-2023, University of Colorado Boulder

/**
 * QUnit tests for TinyForwardingProperty
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from './DerivedProperty.js';
import NumberProperty from './NumberProperty.js';
import TinyForwardingProperty from './TinyForwardingProperty.js';
import TinyProperty from './TinyProperty.js';
import TProperty from './TProperty.js';

QUnit.module( 'TinyForwardingProperty' );

QUnit.test( 'Basics', assert => {

  const myForwardingProperty = new TinyForwardingProperty<boolean | string | number>( true, false );

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

  // This is the pattern for supporting read-only Properties as targetProperties. It has been decided that supporting
  // settability in TypeScript in TinyForwardingProperty is not worth the effort of parametrization. Instead, a type cast
  // and a runtime assertion handle this quite well.
  myForwardingProperty.setTargetProperty( null, null, myDerivedProperty as unknown as TProperty<number> );
  assert.ok( myForwardingProperty.get() === 5, 'should forward after set to DerivedProperty' );

  myProperty.value = 6;
  assert.ok( myForwardingProperty.get() === 11, 'should forward after set to DerivedProperty after dependencies change' );

  window.assert && assert.throws( () => {
    myForwardingProperty.set( 10 );
  }, 'setting readOnly target' );
} );

QUnit.test( 'Forward to a TinyProperty', assert => {

  const myForwardingProperty = new TinyForwardingProperty<boolean | string>( true, false );

  const myTinyProperty = new TinyProperty( 'hi' );

  myForwardingProperty.setTargetProperty( null, null, myTinyProperty );

  assert.ok( myForwardingProperty.value === 'hi', 'forward to tinyProperty' );

  const otherTinyProperty = new TinyProperty( 'seven' );

  myForwardingProperty.setTargetProperty( null, null, otherTinyProperty );

  assert.ok( myForwardingProperty.value === 'seven', 'forward to other TinyProperty' );
} );

QUnit.test( 'Forward to a non PhET-iO case', assert => {

  const myForwardingProperty = new TinyForwardingProperty<boolean | string>( true, false );

  const myTinyProperty = new TinyProperty( 'hi' );

  myForwardingProperty.setTargetProperty( null, null, myTinyProperty );

  assert.ok( myForwardingProperty.value === 'hi', 'forward to tinyProperty' );

  const otherTinyProperty = new TinyProperty( 'seven' );

  myForwardingProperty.setTargetProperty( null, null, otherTinyProperty );

  assert.ok( myForwardingProperty.value === 'seven', 'forward to other TinyProperty' );
  assert.ok( myForwardingProperty[ 'targetProperty' ], 'have a targetProperty' );

  myForwardingProperty.setValueOrTargetProperty( null, null, false );
  assert.ok( myForwardingProperty.value === false, 'set to false value' );
  assert.ok( !myForwardingProperty[ 'targetProperty' ], 'cleared targetProperty' );
} );

QUnit.test( 'Set target but value does not change', assert => {

  const myForwardingProperty = new TinyForwardingProperty( true, false );

  const myTinyProperty = new TinyProperty( false );

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
  assert.ok( myTinyProperty.value === false, 'default value' );

  myForwardingProperty.setTargetProperty( null, null, myTinyProperty );

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
  assert.ok( myForwardingProperty.value === false, 'forward to tinyProperty' );

  let calledListener = false;
  myForwardingProperty.lazyLink( () => {
    calledListener = true;
  } );

  myForwardingProperty.setValueOrTargetProperty( null, null, false );
  assert.ok( !calledListener, 'setting to same value' );
  assert.ok( !myForwardingProperty[ 'targetProperty' ], 'cleared targetProperty' );
} );