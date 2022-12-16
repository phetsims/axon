// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Range from '../../dot/js/Range.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberProperty, { DEFAULT_RANGE } from './NumberProperty.js';
import Property from './Property.js';

QUnit.module( 'NumberProperty' );

QUnit.test( 'Test NumberProperty', assert => {
  assert.ok( true, 'one test needed when running without assertions' );

  let property = new NumberProperty( 42 ); // highly random, do not change

  // valueType
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL
    property = new NumberProperty( 'foo' );
  }, 'initial value has invalid valueType' );
  property = new NumberProperty( 0 );
  property.value = 1;
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL
    property.value = 'foo';
  }, 'set value has invalid valueType' );

  // numberType
  property = new NumberProperty( 0, { numberType: 'FloatingPoint' } );
  property.value = 1;
  property.value = 1.2;
  window.assert && assert.throws( () => {
    property = new NumberProperty( 1.2, { numberType: 'Integer' } );
  }, 'initial value has invalid numberType' );
  window.assert && assert.throws( () => {
    property = new NumberProperty( 0, {
      numberType: 'Integer',
      validValues: [ 0, 1, 1.2, 2 ]
    } );
  }, 'member of validValues has invalid numberType' );
  property = new NumberProperty( 0, { numberType: 'Integer' } );
  property.value = 1;
  window.assert && assert.throws( () => {
    property.value = 1.2;
  }, 'set value has invalid numberType' );

  // range
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL
    property = new NumberProperty( 0, { range: [ 0, 10 ] } );
  }, 'bad range' );
  window.assert && assert.throws( () => {
    property = new NumberProperty( 11, { range: new Range( 0, 10 ) } );
  }, 'initial value is greater than range.max' );
  window.assert && assert.throws( () => {
    property = new NumberProperty( -1, { range: new Range( 0, 10 ) } );
  }, 'initial value is less than range.min' );
  window.assert && assert.throws( () => {
    property = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ 0, 1, 2, 11 ]
    } );
  }, 'member of validValues is greater than range.max' );
  window.assert && assert.throws( () => {
    property = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ -1, 0, 1, 2 ]
    } );
  }, 'member of validValues is less than range.min' );
  property = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  property.value = 5;
  window.assert && assert.throws( () => {
    property.value = 11;
  }, 'set value is greater than range.max' );
  window.assert && assert.throws( () => {
    property.value = -1;
  }, 'set value is less than range.min' );

  // units
  window.assert && assert.throws( () => {
    property = new NumberProperty( 0, { units: 'elephants' } );
  }, 'bad units' );

  ///////////////////////////////
  property = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  property.rangeProperty.value = new Range( 0, 100 );
  property.value = 99;
  property.rangeProperty.value = new Range( 90, 100 );

  // This should not fail, but will until we support nested deferral for PhET-iO support, see https://github.com/phetsims/axon/issues/282
  // p.reset();

  ///////////////////////////////
  property = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  property.value = 5;
  property.rangeProperty.value = new Range( 4, 10 );
  property.reset();
  assert.ok( property.value === 0, 'reset' );
  assert.ok( property.rangeProperty.value.min === 0, 'reset range' );
} );


QUnit.test( 'Test NumberProperty range option as Property', assert => {

  let rangeProperty = new Property( new Range( 0, 1 ) );
  let property = new NumberProperty( 4 );

  // valueType
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL
    property = new NumberProperty( 0, { range: 'hi' } );
  }, 'incorrect range type' );

  property = new NumberProperty( 0, { range: rangeProperty } );
  assert.ok( property.rangeProperty === rangeProperty, 'rangeProperty should be set' );
  assert.ok( property.range === rangeProperty.value, 'rangeProperty value should be set NumberProperty.set on construction' );
  property.value = 1;
  property.value = 0;
  property.value = 0.5;
  window.assert && assert.throws( () => {
    property.value = 2;
  }, 'larger than range' );
  window.assert && assert.throws( () => {
    property.value = -2;
  }, 'smaller than range' );
  window.assert && assert.throws( () => {
    rangeProperty.value = new Range( 5, 10 );
  }, 'current value outside of range' );

  // reset from previous test setting to [5,10]
  property.dispose();
  rangeProperty.dispose();
  rangeProperty = new Property( new Range( 0, 1 ) );

  property = new NumberProperty( 0, { range: rangeProperty } );
  rangeProperty.value = new Range( 0, 10 );
  property.value = 2;

  property.setValueAndRange( 100, new Range( 99, 101 ) );

  const myRange = new Range( 5, 10 );
  property.setValueAndRange( 6, myRange );

  assert.ok( myRange === property.rangeProperty.value, 'reference should be kept' );

  property = new NumberProperty( 0, { range: new Range( 0, 1 ) } );
  assert.ok( property.rangeProperty instanceof Property, 'created a rangeProperty from a range' );

  // deferring ordering dependencies
  ///////////////////////////////////////////////////////
  let pCalled = 0;
  let pRangeCalled = 0;
  property.lazyLink( () => pCalled++ );
  property.rangeProperty.lazyLink( () => pRangeCalled++ );
  property.setDeferred( true );
  property.rangeProperty.setDeferred( true );
  property.set( 3 );
  assert.ok( pCalled === 0, 'p is still deferred, should not call listeners' );
  property.rangeProperty.set( new Range( 2, 3 ) );
  assert.ok( pRangeCalled === 0, 'p.rangeProperty is still deferred, should not call listeners' );
  const notifyPListeners = property.setDeferred( false );


  if ( window.assert ) {
    assert.throws( () => {
      notifyPListeners && notifyPListeners();
    }, 'rangeProperty is not yet undeferred and so has the wrong value' );

    property[ 'notifying' ] = false; // since the above threw an error, reset
  }
  const notifyRangeListeners = property.rangeProperty.setDeferred( false );
  notifyPListeners && notifyPListeners();
  assert.ok( pCalled === 1, 'p listeners should have been called' );
  notifyRangeListeners && notifyRangeListeners();
  assert.ok( pRangeCalled === 1, 'p.rangeProperty is still deferred, should not call listeners' );

  property.setValueAndRange( -100, new Range( -101, -99 ) );
  assert.ok( pCalled === 2, 'p listeners should have been called again' );
  assert.ok( pRangeCalled === 2, 'p.rangeProperty is still deferred, should not call listeners again' );

  property = new NumberProperty( 0 );
  property.value = 4;
  assert.ok( property.rangeProperty.value === DEFAULT_RANGE, 'rangeProperty should have been created' );
  property.rangeProperty.value = new Range( 0, 4 );
  window.assert && assert.throws( () => {
    property.value = 5;
  }, 'current value outside of range' );
} );
QUnit.test( 'Test NumberProperty phet-io options', assert => {

  const tandem = Tandem.ROOT_TEST;
  let property = new NumberProperty( 0, {
    range: new Range( 0, 20 ),
    tandem: tandem.createTandem( 'numberProperty' ),
    rangePropertyOptions: { tandem: tandem.createTandem( 'rangeProperty' ) }
  } );

  assert.ok( property.rangeProperty.isPhetioInstrumented(), 'rangeProperty instrumented' );
  assert.ok( property.rangeProperty.tandem.name === 'rangeProperty', 'rangeProperty instrumented' );

  property.dispose();

  property = new NumberProperty( 0, {
    range: DEFAULT_RANGE
  } );
  assert.ok( !property.rangeProperty.isPhetioInstrumented(), 'null ranges do not get instrumented rangeProperty' );

  window.assert && Tandem.VALIDATION && assert.throws( () => {
    property = new NumberProperty( 0, {
      range: new Range( 0, 20 ),
      tandem: tandem.createTandem( 'numberProperty2' ),
      rangePropertyOptions: { tandem: tandem.createTandem( 'rangePropertyfdsa' ) }
    } );
  }, 'cannot instrument default rangeProperty with tandem other than "rangeProperty"' );
  property.dispose();
} );
