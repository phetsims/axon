// Copyright 2021-2023, University of Colorado Boulder

/**
 * QUnit tests for EnabledComponent
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from './BooleanProperty.js';
import EnabledComponent, { EnabledComponentOptions } from './EnabledComponent.js';
import Property from './Property.js';

QUnit.module( 'EnabledComponent' );

QUnit.test( 'EnabledComponent into Object', assert => {

  class EnabledObject extends EnabledComponent {
    public constructor( options?: EnabledComponentOptions ) {
      super( options );
    }
  }

  const object = new EnabledObject();
  testEnabledComponent( assert, object, 'default enabledProperty created' );

  object[ 'disposeEnabledComponent' ]();
  assert.ok( object.enabledProperty.isDisposed, 'enabledProperty should be disposed because it was not passed in' );

  const myEnabledProperty = new BooleanProperty( false );
  const passedInEnabledPropertyObject = new EnabledObject( {
    enabledProperty: myEnabledProperty
  } );
  testEnabledComponent( assert, object, 'passed in enabledProperty' );
  assert.ok( myEnabledProperty === passedInEnabledPropertyObject.enabledProperty, 'passed in should be the same' );
  passedInEnabledPropertyObject[ 'disposeEnabledComponent' ]();
  assert.ok( !myEnabledProperty.isDisposed, 'do not dispose my enabledProperty!' );
} );

QUnit.test( 'EnabledComponent.isDisposable', assert => {
  assert.ok( true, 'when no window.assertions' );

  const object1 = new EnabledComponent( {
    isDisposable: true
  } );
  const object2 = new EnabledComponent();
  const object3 = new EnabledComponent( {
    isDisposable: false
  } );

  object1.dispose();
  object2.dispose();
  if ( window.assert ) {
    assert.throws( () => object3.dispose(), 'should throw if isDisposable is false' );
  }
} );

/**
 * Test basic functionality for an object that uses EnabledComponent
 * assert - from QUnit
 * enabledObject - subtype of EnabledComponent
 * message - to tack onto assert messages
 */
function testEnabledComponent( assert: Assert, enabledObject: EnabledComponent, message: string ): void {
  assert.ok( enabledObject.enabledProperty instanceof Property, `${message}: enabledProperty should exist` );
  assert.ok( enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter` );

  enabledObject.enabled = false;
  assert.ok( !enabledObject.enabled, `${message}: test setter` );
  assert.ok( enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter after setting` );
  assert.ok( !enabledObject.enabledProperty.value, `${message}: test getter after setting` );
}
