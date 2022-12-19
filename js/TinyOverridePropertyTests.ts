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
  const tiny1Property = new TinyProperty( 'x' );
  const tiny2Property = new TinyProperty( 'a' );
  const overrideProperty = new TinyOverrideProperty( tiny1Property );

  let lastNewValue;
  let lastOldValue;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    console.log( newValue, oldValue );
    lastNewValue = newValue;
    lastOldValue = oldValue;
  } );

  assert.equal( tiny1Property.value, 'x' );
  assert.equal( overrideProperty.value, 'x' );

  tiny1Property.value = 'y';
  assert.equal( tiny1Property.value, 'y' );
  assert.equal( overrideProperty.value, 'y', 'We follow target Property changes originally' );
  assert.equal( lastNewValue, 'y' );
  assert.equal( lastOldValue, 'x' );

  overrideProperty.targetProperty = tiny2Property;
  assert.equal( tiny2Property.value, 'a' );
  assert.equal( overrideProperty.value, 'a', 'Switching target properties should result in a change' );
  assert.equal( lastNewValue, 'a' );
  assert.equal( lastOldValue, 'y' );

  tiny2Property.value = 'b';
  assert.equal( tiny2Property.value, 'b' );
  assert.equal( overrideProperty.value, 'b', 'We follow our new target Property changes originally' );
  assert.equal( lastNewValue, 'b' );
  assert.equal( lastOldValue, 'a' );

  overrideProperty.value = 'z';
  assert.equal( tiny2Property.value, 'b', 'Setting the override should not modify the original' );
  assert.equal( overrideProperty.value, 'z', 'Our value should have diverged' );
  assert.equal( lastNewValue, 'z' );
  assert.equal( lastOldValue, 'b' );

  tiny2Property.value = 'c';
  assert.equal( tiny2Property.value, 'c' );
  assert.equal( overrideProperty.value, 'z', 'We should be overridden, so we ignore the Property' );
} );

QUnit.test( 'TinyOverrideProperty targetProperty change', assert => {
  const tiny1Property = new TinyProperty( 'x' );
  const tiny2Property = new TinyProperty( 'a' );
  const overrideProperty = new TinyOverrideProperty( tiny1Property );

  let lastNewValue;
  let lastOldValue;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    console.log( newValue, oldValue );
    lastNewValue = newValue;
    lastOldValue = oldValue;
  } );

  assert.equal( tiny1Property.value, 'x' );
  assert.equal( overrideProperty.value, 'x' );

  tiny1Property.value = 'y';
  assert.equal( tiny1Property.value, 'y' );
  assert.equal( overrideProperty.value, 'y', 'We follow target Property changes originally' );
  assert.equal( lastNewValue, 'y' );
  assert.equal( lastOldValue, 'x' );

  overrideProperty.targetProperty = tiny2Property;
  assert.equal( tiny2Property.value, 'a' );
  assert.equal( overrideProperty.value, 'a', 'Switching target properties should result in a change' );
  assert.equal( lastNewValue, 'a' );
  assert.equal( lastOldValue, 'y' );

  tiny2Property.value = 'b';
  assert.equal( tiny2Property.value, 'b' );
  assert.equal( overrideProperty.value, 'b', 'We follow our new target Property changes originally' );
  assert.equal( lastNewValue, 'b' );
  assert.equal( lastOldValue, 'a' );

  overrideProperty.value = 'z';
  assert.equal( tiny2Property.value, 'b', 'Setting the override should not modify the original' );
  assert.equal( overrideProperty.value, 'z', 'Our value should have diverged' );
  assert.equal( lastNewValue, 'z' );
  assert.equal( lastOldValue, 'b' );

  tiny2Property.value = 'c';
  assert.equal( tiny2Property.value, 'c' );
  assert.equal( overrideProperty.value, 'z', 'We should be overridden, so we ignore the Property' );
} );

QUnit.test( 'TinyOverrideProperty no notify on targetProperty change with same value', assert => {
  const tiny1Property = new TinyProperty( 'f' );
  const tiny2Property = new TinyProperty( 'f' );
  const overrideProperty = new TinyOverrideProperty( tiny1Property );

  let notified = false;
  overrideProperty.lazyLink( ( newValue, oldValue ) => {
    notified = true;
  } );

  overrideProperty.targetProperty = tiny2Property;

  assert.equal( notified, false );
} );
