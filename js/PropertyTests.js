// Copyright 2017-2021, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';

QUnit.module( 'Property' );

QUnit.test( 'Test unlink', assert => {
  const p = new Property( 1 );
  const startingPListenerCount = p.getListenerCount();
  const a = function( a ) {};
  const b = function( b ) {};
  const c = function( c ) {};
  p.link( a );
  p.link( b );
  p.link( c );
  assert.equal( p.getListenerCount(), 3 + startingPListenerCount, 'should have 3 observers now' );
  p.unlink( b );
  assert.ok( p.hasListener( a ), 'should have removed b' );
  assert.ok( p.hasListener( c ), 'should have removed b' );
  assert.equal( p.getListenerCount(), 2 + startingPListenerCount, 'should have removed an item' );
} );

QUnit.test( 'Test Property.multilink', assert => {
  const a = new Property( 1 );
  const b = new Property( 2 );
  let callbacks = 0;
  Property.multilink( [ a, b ], ( a, b ) => {
    callbacks++;
    assert.equal( a, 1, 'first value should pass through' );
    assert.equal( b, 2, 'second value should pass through' );
  } );
  assert.equal( callbacks, 1, 'should have called back to a multilink' );
} );

QUnit.test( 'Test Property.lazyMultilink', assert => {
  const a = new Property( 1 );
  const b = new Property( 2 );
  let callbacks = 0;
  Property.lazyMultilink( [ a, b ], ( a, b ) => {
    callbacks++;
    assert.equal( a, 1 );
    assert.equal( b, 2 );
  } );
  assert.equal( callbacks, 0, 'should not call back to a lazy multilink' );
} );

QUnit.test( 'Test defer', assert => {
  const property = new Property( 0 );
  let callbacks = 0;
  property.lazyLink( ( newValue, oldValue ) => {
    callbacks++;
    assert.equal( newValue, 2, 'newValue should be the final value after the transaction' );
    assert.equal( oldValue, 0, 'oldValue should be the original value before the transaction' );
  } );
  property.setDeferred( true );
  property.value = 1;
  property.value = 2;
  assert.equal( property.value, 0, 'should have original value' );
  const update = property.setDeferred( false );
  assert.equal( callbacks, 0, 'should not call back while deferred' );
  assert.equal( property.value, 2, 'should have new value' );
  update();
  assert.equal( callbacks, 1, 'should have been called back after update' );
  assert.equal( property.value, 2, 'should take final value' );
} );

QUnit.test( 'Property ID checks', assert => {
  assert.ok( new Property( 1 ).id !== new Property( 1 ).id, 'Properties should have unique IDs' ); // eslint-disable-line no-self-compare
} );

QUnit.test( 'Property link parameters', assert => {
  const p = new Property( 1 );
  const calls = [];
  p.link( ( newValue, oldValue, property ) => {
    calls.push( {
      newValue: newValue,
      oldValue: oldValue,
      property: property
    } );
  } );
  p.value = 2;

  assert.ok( calls.length === 2 );

  assert.ok( calls[ 0 ].newValue === 1 );
  assert.ok( calls[ 0 ].oldValue === null );
  assert.ok( calls[ 0 ].property === p );

  assert.ok( calls[ 1 ].newValue === 2 );
  assert.ok( calls[ 1 ].oldValue === 1 );
  assert.ok( calls[ 1 ].property === p );
} );

/**
 * Make sure linking attributes and unlinking attributes works on Property
 */
QUnit.test( 'Property.linkAttribute', assert => {
  const property = new Property( 7 );
  const state = { age: 99 };
  const listener = property.linkAttribute( state, 'age' );
  assert.equal( state.age, 7, 'link should synchronize values' );
  property.value = 8;
  assert.equal( state.age, 8, 'link should update values' );
  property.unlinkAttribute( listener );
  property.value = 9;
  assert.equal( state.age, 8, 'state should not have changed after unlink' );
} );

QUnit.test( 'Property value validation', assert => {

  // Type that is specific to valueType tests
  function TestType() {}

  let property = null;
  let options = {};

  // valueType is a primitive type (typeof validation)
  options = {
    valueType: 'string'
  };
  window.assert && assert.throws( () => {
    new Property( 0, { valueType: 'foo' } ); // eslint-disable-line
  }, 'options.valueType is invalid, expected a primitive data type' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line
  }, 'invalid initial value with options.valueType typeof validation' );
  property = new Property( 'horizontal', options );
  property.set( 'vertical' );
  window.assert && assert.throws( () => {
    property.set( 0 );
  }, 'invalid set value with options.valueType typeof validation' );

  // valueType is a constructor (instanceof validation)
  options = {
    valueType: TestType
  };
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line
  }, 'invalid initial value for options.valueType instanceof validation' );
  property = new Property( new TestType(), options );
  property.set( new TestType() );
  window.assert && assert.throws( () => {
    property.set( 0 );
  }, 'invalid set value with options.valueType instanceof validation' );

  // validValues
  options = {
    validValues: [ 1, 2, 3 ]
  };
  window.assert && assert.throws( () => {
    new Property( 0, { validValues: 0 } ); // eslint-disable-line
  }, 'options.validValues is invalid' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line
  }, 'invalid initial value with options.validValues' );
  property = new Property( 1, options );
  property.set( 3 );
  window.assert && assert.throws( () => {
    property.set( 4 );
  }, 'invalid set value with options.validValues' );

  // isValidValues
  options = {
    isValidValue: function( value ) {
      return ( value > 0 && value < 4 );
    }
  };
  window.assert && assert.throws( () => {
    new Property( 0, { isValidValue: 0 } ); // eslint-disable-line
  }, 'options.isValidValue is invalid' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line
  }, 'invalid initial value with options.isValidValue' );
  property = new Property( 1, options );
  property.set( 3 );
  window.assert && assert.throws( () => {
    property.set( 4 );
  }, 'invalid set value with options.isValidValue' );

  // Compatible combinations of validation options, possibly redundant (not exhaustive)
  options = {
    valueType: 'string',
    validValues: [ 'bob', 'joe', 'sam' ],
    isValidValue: function( value ) {
      return value.length === 3;
    }
  };
  property = new Property( 'bob', options );
  window.assert && assert.throws( () => {
    property.set( 0 );
  }, 'invalid set value with compatible combination of validation options' );
  window.assert && assert.throws( () => {
    property.set( 'ted' );
  }, 'invalid set value with compatible combination of validation options' );

  // Incompatible combinations of validation options (not exhaustive)
  // These tests will always fail on initialization, since the validation criteria are contradictory.
  options = {
    valueType: 'number',
    validValues: [ 'bob', 'joe', 'sam' ],
    isValidValue: function( value ) {
      return value.length === 4;
    }
  };
  window.assert && assert.throws( () => {
    property = new Property( 0, options );
  }, 'invalid initial value with incompatible combination of validation options' );
  window.assert && assert.throws( () => {
    property = new Property( 'bob', options );
  }, 'invalid initial value with incompatible combination of validation options' );
  window.assert && assert.throws( () => {
    property = new Property( 'fred', options );
  }, 'invalid initial value with incompatible combination of validation options' );

  assert.ok( true, 'so we have at least 1 test in this set' );
} );

// Tests that can only run in phet-io mode
if ( Tandem.PHET_IO_ENABLED ) {
  QUnit.test( 'Test PropertyIO toStateObject/fromStateObject', assert => {
    const done = assert.async();
    const tandem = Tandem.ROOT_TEST.createTandem( 'testTandemProperty' );
    const phetioType = NumberProperty.NumberPropertyIO;
    const propertyValue = 123;
    const validValues = [ 0, 1, 2, 3, propertyValue ];
    tandem.addPhetioObject = function( instance, options ) {

      // PhET-iO operates under the assumption that nothing will access a PhetioObject until the next animation frame
      // when the object is fully constructed.  For example, Property state variables are set after the callback
      // to addPhetioObject, which occurs during Property.constructor.super().
      setTimeout( () => { // eslint-disable-line bad-sim-text

        // Run in the next frame after the object finished getting constructed
        const stateObject = phetioType.toStateObject( instance );
        assert.equal( stateObject.value, propertyValue, 'toStateObject should match' );
        assert.deepEqual( stateObject.validValues, validValues, 'toStateObject should match' );
        done();
      }, 0 );
    };
    new NumberProperty( propertyValue, { // eslint-disable-line
      tandem: tandem,
      validValues: validValues
    } );
  } );

  QUnit.test( 'propertyStateHandlerSingleton tests for Property', assert => {
    const parentTandem = Tandem.ROOT_TEST;

    const originalOrderDependencyLength = propertyStateHandlerSingleton.getNumberOfOrderDependencies();
    const getOrderDependencyLength = () => propertyStateHandlerSingleton.getNumberOfOrderDependencies() - originalOrderDependencyLength;

    const firstProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'firstProperty' ),
      phetioType: Property.PropertyIO( NumberIO )
    } );
    const secondProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'secondProperty' ),
      phetioType: Property.PropertyIO( NumberIO )
    } );

    propertyStateHandlerSingleton.registerPhetioOrderDependency( firstProperty, PropertyStatePhase.NOTIFY, secondProperty, PropertyStatePhase.UNDEFER );

    firstProperty.dispose();
    assert.ok( getOrderDependencyLength() === 0, 'dispose removes order dependency' );

    const thirdProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'thirdProperty' ),
      phetioType: Property.PropertyIO( NumberIO )
    } );
    secondProperty.link( () => { thirdProperty.value = 2;}, {
      phetioDependencies: [ thirdProperty ]
    } );

    assert.ok( getOrderDependencyLength() === 1, 'just added orderDependency from phetioDependencies' );

    secondProperty.dispose();
    assert.ok( getOrderDependencyLength() === 0, 'dispose removes order dependency' );

    thirdProperty.dispose();
  } );
}