// Copyright 2022, University of Colorado Boulder

/**
 * QUnit tests for TinyOverrideProperty
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyProperty from './TinyProperty.js';
import TinyOverrideProperty from './TinyOverrideProperty.js';

QUnit.module( 'TinyOverrideProperty' );

QUnit.test( 'TinyOverrideProperty Basics', assert => {
  const property = new TinyProperty( 'x' );
  const overrideProperty = new TinyOverrideProperty( property );

  let lastNewValue;
  let lastOldValue;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    console.log( newValue, oldValue );
    lastNewValue = newValue;
    lastOldValue = oldValue;
  } );

  assert.equal( property.value, 'x' );
  assert.equal( overrideProperty.value, 'x' );

  property.value = 'y';
  assert.equal( property.value, 'y' );
  assert.equal( overrideProperty.value, 'y', 'We follow target Property changes originally' );
  assert.equal( lastNewValue, 'y' );
  assert.equal( lastOldValue, 'x' );

  overrideProperty.value = 'z';
  assert.equal( property.value, 'y', 'Setting the override should not modify the original' );
  assert.equal( overrideProperty.value, 'z', 'Our value should have diverged' );
  assert.equal( lastNewValue, 'z' );
  assert.equal( lastOldValue, 'y' );

  property.value = 'w';
  assert.equal( property.value, 'w' );
  assert.equal( overrideProperty.value, 'z', 'We should be overridden, so we ignore the Property' );
} );

QUnit.test( 'TinyOverrideProperty targetProperty change', assert => {
  const property1 = new TinyProperty( 'x' );
  const property2 = new TinyProperty( 'a' );
  const overrideProperty = new TinyOverrideProperty( property1 );

  let lastNewValue;
  let lastOldValue;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    console.log( newValue, oldValue );
    lastNewValue = newValue;
    lastOldValue = oldValue;
  } );

  assert.equal( property1.value, 'x' );
  assert.equal( overrideProperty.value, 'x' );

  property1.value = 'y';
  assert.equal( property1.value, 'y' );
  assert.equal( overrideProperty.value, 'y', 'We follow target Property changes originally' );
  assert.equal( lastNewValue, 'y' );
  assert.equal( lastOldValue, 'x' );

  overrideProperty.targetProperty = property2;
  assert.equal( property2.value, 'a' );
  assert.equal( overrideProperty.value, 'a', 'Switching target properties should result in a change' );
  assert.equal( lastNewValue, 'a' );
  assert.equal( lastOldValue, 'y' );

  property2.value = 'b';
  assert.equal( property2.value, 'b' );
  assert.equal( overrideProperty.value, 'b', 'We follow our new target Property changes originally' );
  assert.equal( lastNewValue, 'b' );
  assert.equal( lastOldValue, 'a' );

  overrideProperty.value = 'z';
  assert.equal( property2.value, 'b', 'Setting the override should not modify the original' );
  assert.equal( overrideProperty.value, 'z', 'Our value should have diverged' );
  assert.equal( lastNewValue, 'z' );
  assert.equal( lastOldValue, 'b' );

  property2.value = 'c';
  assert.equal( property2.value, 'c' );
  assert.equal( overrideProperty.value, 'z', 'We should be overridden, so we ignore the Property' );
} );

QUnit.test( 'TinyOverrideProperty targetProperty change', assert => {
  const property1 = new TinyProperty( 'x' );
  const property2 = new TinyProperty( 'a' );
  const overrideProperty = new TinyOverrideProperty( property1 );

  let lastNewValue;
  let lastOldValue;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    console.log( newValue, oldValue );
    lastNewValue = newValue;
    lastOldValue = oldValue;
  } );

  assert.equal( property1.value, 'x' );
  assert.equal( overrideProperty.value, 'x' );

  property1.value = 'y';
  assert.equal( property1.value, 'y' );
  assert.equal( overrideProperty.value, 'y', 'We follow target Property changes originally' );
  assert.equal( lastNewValue, 'y' );
  assert.equal( lastOldValue, 'x' );

  overrideProperty.targetProperty = property2;
  assert.equal( property2.value, 'a' );
  assert.equal( overrideProperty.value, 'a', 'Switching target properties should result in a change' );
  assert.equal( lastNewValue, 'a' );
  assert.equal( lastOldValue, 'y' );

  property2.value = 'b';
  assert.equal( property2.value, 'b' );
  assert.equal( overrideProperty.value, 'b', 'We follow our new target Property changes originally' );
  assert.equal( lastNewValue, 'b' );
  assert.equal( lastOldValue, 'a' );

  overrideProperty.value = 'z';
  assert.equal( property2.value, 'b', 'Setting the override should not modify the original' );
  assert.equal( overrideProperty.value, 'z', 'Our value should have diverged' );
  assert.equal( lastNewValue, 'z' );
  assert.equal( lastOldValue, 'b' );

  property2.value = 'c';
  assert.equal( property2.value, 'c' );
  assert.equal( overrideProperty.value, 'z', 'We should be overridden, so we ignore the Property' );
} );

QUnit.test( 'TinyOverrideProperty no notify on targetProperty change with same value', assert => {
  const property1 = new TinyProperty( 'f' );
  const property2 = new TinyProperty( 'f' );
  const overrideProperty = new TinyOverrideProperty( property1 );

  let notified = false;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    notified = true;
  } );

  overrideProperty.targetProperty = property2;

  assert.equal( notified, false );
} );
