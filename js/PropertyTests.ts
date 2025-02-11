// Copyright 2017-2025, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Vector2 from '../../dot/js/Vector2.js';
import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import merge from '../../phet-core/js/merge.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import Tandem from '../../tandem/js/Tandem.js';
import Multilink from './Multilink.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import type TReadOnlyProperty from './TReadOnlyProperty.js';

QUnit.module( 'Property' );

QUnit.test( 'Test unlink', assert => {
  const property = new Property( 1 );
  const startingPListenerCount = property[ 'getListenerCount' ]();
  const a = function( a: unknown ) { _.noop; };
  const b = function( b: unknown ) { _.noop; };
  const c = function( c: unknown ) { _.noop; };
  property.link( a );
  property.link( b );
  property.link( c );
  assert.equal( property[ 'getListenerCount' ](), 3 + startingPListenerCount, 'should have 3 observers now' );
  property.unlink( b );
  assert.ok( property.hasListener( a ), 'should have removed b' );
  assert.ok( property.hasListener( c ), 'should have removed b' );
  assert.equal( property[ 'getListenerCount' ](), 2 + startingPListenerCount, 'should have removed an item' );
} );

QUnit.test( 'Test Multilink.multilink', assert => {
  const aProperty = new Property( 1 );
  const bProperty = new Property( 2 );
  let callbacks = 0;
  Multilink.multilink( [ aProperty, bProperty ], ( a, b ) => {
    callbacks++;
    assert.equal( a, 1, 'first value should pass through' );
    assert.equal( b, 2, 'second value should pass through' );
  } );
  assert.equal( callbacks, 1, 'should have called back to a multilink' );
} );

QUnit.test( 'Test Multilink.lazyMultilink', assert => {
  const aProperty = new Property( 1 );
  const bProperty = new Property( 2 );
  let callbacks = 0;
  Multilink.lazyMultilink( [ aProperty, bProperty ], ( a, b ) => {
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

  // @ts-expect-error .setDeferred(false) will always return () => void
  update();
  assert.equal( callbacks, 1, 'should have been called back after update' );
  assert.equal( property.value, 2, 'should take final value' );
} );

QUnit.test( 'Property ID checks', assert => {
  assert.ok( new Property( 1 )[ 'id' ] !== new Property( 1 )[ 'id' ], 'Properties should have unique IDs' ); // eslint-disable-line no-self-compare
} );

type callValues = {
  newValue: number;
  oldValue: number | null;
  property: TReadOnlyProperty<number>;
};

QUnit.test( 'Property link parameters', assert => {
  const property = new Property( 1 );
  const calls: Array<callValues> = [];
  property.link( ( newValue, oldValue, property ) => {
    calls.push( {
      newValue: newValue,
      oldValue: oldValue,
      property: property
    } );
  } );
  property.value = 2;

  assert.ok( calls.length === 2 );

  assert.ok( calls[ 0 ].newValue === 1 );
  assert.ok( calls[ 0 ].oldValue === null );
  assert.ok( calls[ 0 ].property === property );

  assert.ok( calls[ 1 ].newValue === 2 );
  assert.ok( calls[ 1 ].oldValue === 1 );
  assert.ok( calls[ 1 ].property === property );
} );

/**
 * Make sure linking attributes and unlinking attributes works on Property
 */
QUnit.test( 'Property.linkAttribute', assert => {
  const property = new Property( 7 );
  const state = { age: 99 };
  const listener = ( age: number ) => {
    state.age = age;
  };
  property.link( listener );
  assert.equal( state.age, 7, 'link should synchronize values' );
  property.value = 8;
  assert.equal( state.age, 8, 'link should update values' );
  property.unlink( listener );
  property.value = 9;
  assert.equal( state.age, 8, 'state should not have changed after unlink' );
} );

QUnit.test( 'Property value validation', assert => {

  // Type that is specific to valueType tests
  class TestType {
    public constructor() { _.noop(); }
  }

  let property: IntentionalAny = null;
  let options = {};

  // valueType is a primitive type (typeof validation)
  options = {
    valueType: 'string'
  };
  window.assert && assert.throws( () => {
    new Property( 0, { valueType: 'foo' } ); // eslint-disable-line no-new
  }, 'options.valueType is invalid, expected a primitive data type' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line no-new
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
    new Property( 0, options ); // eslint-disable-line no-new
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

    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property( 0, { validValues: 0 } ); // eslint-disable-line no-new
  }, 'options.validValues is invalid' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line no-new
  }, 'invalid initial value with options.validValues' );
  property = new Property( 1, options );
  property.set( 3 );
  window.assert && assert.throws( () => {
    property.set( 4 );
  }, 'invalid set value with options.validValues' );

  // isValidValues
  options = {
    isValidValue: function( value: number ) {
      return ( value > 0 && value < 4 );
    }
  };
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property( 0, { isValidValue: 0 } ); // eslint-disable-line no-new
  }, 'options.isValidValue is invalid' );
  window.assert && assert.throws( () => {
    new Property( 0, options ); // eslint-disable-line no-new
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
    isValidValue: function( value: string ) {
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
    isValidValue: function( value: string ) {
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

QUnit.test( 'do not recurse in merge for non *Options', assert => {

  const testFirstProperty = new Property( 'hi' );
  const testSecondProperty = new Property( 'hi2' );
  const TestEnumeration = EnumerationDeprecated.byKeys( [ 'ONE', 'TWO' ] );
  const TestEnumeration2 = EnumerationDeprecated.byKeys( [ 'ONE1', 'TWO2' ] );
  const original = {
    prop: testFirstProperty,
    enum: TestEnumeration,
    someOptions: { nestedProp: testFirstProperty }
  };

  let newObject = merge( {}, original );
  assert.ok( _.isEqual( original, newObject ), 'should be equal from reference equality' );
  assert.ok( original.prop === newObject.prop, 'same Property' );
  assert.ok( original.enum === newObject.enum, 'same EnumerationDeprecated' );

  // test defaults with other non mergeable objects
  newObject = merge( {
    prop: testSecondProperty,
    enum: TestEnumeration2,
    someOptions: { nestedProp: testSecondProperty }
  }, original );
  assert.ok( _.isEqual( original, newObject ), 'should be equal' );
  assert.ok( original.prop === newObject.prop, 'same Property, ignore default' );
  assert.ok( original.enum === newObject.enum, 'same EnumerationDeprecated, ignore default' );
} );

QUnit.test( 'reentrantNotificationStrategy', assert => {
  assert.ok( new Property( 'hi' )[ 'tinyProperty' ][ 'reentrantNotificationStrategy' ] === 'queue',
    'default notification strategy for Property should be "queue"' );

  ////////////////////////////////////////////
  // queue
  let queueCount = 2; // starts as a value of 1, so 2 is the first value we change to.

  // queue is default
  const queueProperty = new Property<number>( 1, {
    reentrantNotificationStrategy: 'queue',
    reentrant: true
  } );

  queueProperty.lazyLink( value => {
    if ( value < 10 ) {
      queueProperty.value = value + 1;
    }
  } );

  // notify-queue:
  // 1->2
  // 2->3
  // 3->4
  // ...
  // 8->9

  queueProperty.lazyLink( ( value, oldValue ) => {
    assert.ok( value === oldValue + 1, `increment each time: ${oldValue} -> ${value}` );
    assert.ok( value === queueCount++, `increment by most recent changed: ${queueCount - 2}->${queueCount - 1}, received: ${oldValue} -> ${value}` );
  } );
  queueProperty.value = queueCount;

  let stackCount = 2; // starts as a value of 1, so 2 is the first value we change to.
  const finalCount = 10;
  let lastListenerCount = 10;
  ////////////////////////////////////////////

  ////////////////////////////////////////////
  // stack
  const stackProperty = new Property<number>( stackCount - 1, {
    reentrantNotificationStrategy: 'stack',
    reentrant: true
  } );

  stackProperty.lazyLink( value => {
    if ( value < finalCount ) {
      stackProperty.value = value + 1;
    }
  } );

  // stack-notify:
  // 8->9
  // 7->8
  // 6->7
  // ...
  // 1->2
  stackProperty.lazyLink( ( value, oldValue ) => {
    stackCount++;
    assert.ok( value === oldValue + 1, `increment each time: ${oldValue} -> ${value}` );
    assert.ok( value === lastListenerCount--, `increment in order expected: ${lastListenerCount}->${lastListenerCount + 1}, received: ${oldValue} -> ${value}` );
    assert.ok( oldValue === lastListenerCount, `new count is ${lastListenerCount}: the oldValue (most recent first in stack first` );
  } );
  stackProperty.value = stackCount;
  //////////////////////////////////////////////////

} );

QUnit.test( 'options.valueComparisonStrategy', assert => {

  let calledCount = 0;
  let myProperty = new Property<IntentionalAny>( new Vector2( 0, 0 ), {
    valueComparisonStrategy: 'equalsFunction'
  } );
  myProperty.lazyLink( () => calledCount++ );

  myProperty.value = new Vector2( 0, 0 );
  assert.ok( calledCount === 0, 'equal' );
  myProperty.value = new Vector2( 0, 3 );
  assert.ok( calledCount === 1, 'not equal' );

  calledCount = 0;
  myProperty = new Property<IntentionalAny>( new Vector2( 0, 0 ), {
    valueComparisonStrategy: 'lodashDeep'
  } );
  myProperty.lazyLink( () => calledCount++ );

  myProperty.value = { something: 'hi' };
  assert.ok( calledCount === 1, 'not equal' );
  myProperty.value = { something: 'hi' };
  assert.ok( calledCount === 1, 'equal' );
  myProperty.value = { something: 'hi', other: false };
  assert.ok( calledCount === 2, 'not equal with other key' );
} );

///////////////////////////////
// START PHET_IO ONLY TESTS
///////////////////////////////
if ( Tandem.PHET_IO_ENABLED ) {
// Tests that can only run in phet-io mode

  QUnit.test( 'Test PropertyIO toStateObject/fromStateObject', assert => {
    const done = assert.async();
    const tandem = Tandem.ROOT_TEST.createTandem( 'testTandemProperty' );
    const phetioType = NumberProperty.NumberPropertyIO;
    const propertyValue = 123;
    const validValues = [ 0, 1, 2, 3, propertyValue ];

    // @ts-expect-error redefining function for testing
    tandem.addPhetioObject = function( instance: NumberProperty, options: IntentionalAny ): void {

      // PhET-iO operates under the assumption that nothing will access a PhetioObject until the next animation frame
      // when the object is fully constructed.  For example, Property state variables are set after the callback
      // to addPhetioObject, which occurs during Property.constructor.super().
      setTimeout( () => { // eslint-disable-line phet/bad-sim-text

        // Run in the next frame after the object finished getting constructed
        const stateObject = phetioType.toStateObject( instance );
        assert.equal( stateObject.value, propertyValue, 'toStateObject should match' );
        assert.deepEqual( stateObject.validValues, validValues, 'toStateObject should match' );
        done();
      }, 0 );
    };
    new NumberProperty( propertyValue, { // eslint-disable-line no-new
      tandem: tandem,
      validValues: validValues
    } );
  } );
}
///////////////////////////////
// END PHET_IO ONLY TESTS
///////////////////////////////