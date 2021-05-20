// Copyright 2021, University of Colorado Boulder

/**
 * QUnit tests for EnabledComponent
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from './BooleanProperty.js';
import Property from './Property.js';
import EnabledComponent from './EnabledComponent.js';

QUnit.module( 'EnabledComponent' );

QUnit.test( 'EnabledComponent into Object', assert => {

  class EnabledObject extends EnabledComponent {
    constructor( options ) {
      super( options );
    }
  }

  const object = new EnabledObject();
  testEnabledComponent( assert, object, 'default enabledProperty created' );

  object.disposeEnabledComponent();
  assert.ok( object.enabledProperty.isDisposed, 'enabledProperty should be disposed because it was not passed in' );

  const myEnabledProperty = new BooleanProperty( false );
  const passedInEnabledPropertyObject = new EnabledObject( {
    enabledProperty: myEnabledProperty
  } );
  testEnabledComponent( assert, object, 'passed in enabledProperty' );
  assert.ok( myEnabledProperty === passedInEnabledPropertyObject.enabledProperty, 'passed in should be the same' );
  passedInEnabledPropertyObject.disposeEnabledComponent();
  assert.ok( !myEnabledProperty.isDisposed, 'do not dispose my enabledProperty!' );
} );

/**
 * Test basic functionality for an object that uses EnabledComponent
 * @param {Object} assert - from QUnit
 * @param {Object} enabledObject - subtype of EnabledComponent
 * @param {string} message - to tack onto assert messages
 */
function testEnabledComponent( assert, enabledObject, message ) {
  assert.ok( enabledObject.enabledProperty instanceof Property, `${message}: enabledProperty should exist` );
  assert.ok( enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter` );

  enabledObject.enabled = false;
  assert.ok( enabledObject.enabled === false, `${message}: test setter` );
  assert.ok( enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter after setting` );
  assert.ok( enabledObject.enabledProperty.value === false, `${message}: test getter after setting` );
}
