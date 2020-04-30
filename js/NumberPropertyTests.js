// Copyright 2017-2020, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Range from '../../dot/js/Range.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';

QUnit.module( 'NumberProperty' );

QUnit.test( 'Test NumberProperty', assert => {

  let p = null;

  // valueType
  window.assert && assert.throws( () => {
    p = new NumberProperty( 'foo' );
  }, 'initial value has invalid valueType' );
  p = new NumberProperty( 0 );
  p.value = 1;
  window.assert && assert.throws( () => {
    p.value = 'foo';
  }, 'set value has invalid valueType' );

  // numberType
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { numberType: 0 } );
  }, 'bad numberType' );
  p = new NumberProperty( 0, { numberType: 'FloatingPoint' } );
  p.value = 1;
  p.value = 1.2;
  window.assert && assert.throws( () => {
    p = new NumberProperty( 1.2, { numberType: 'Integer' } );
  }, 'initial value has invalid numberType' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      numberType: 'Integer',
      validValues: [ 0, 1, 1.2, 2 ]
    } );
  }, 'member of validValues has invalid numberType' );
  p = new NumberProperty( 0, { numberType: 'Integer' } );
  p.value = 1;
  window.assert && assert.throws( () => {
    p.value = 1.2;
  }, 'set value has invalid numberType' );

  // range
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { range: [ 0, 10 ] } );
  }, 'bad range' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 11, { range: new Range( 0, 10 ) } );
  }, 'initial value is greater than range.max' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( -1, { range: new Range( 0, 10 ) } );
  }, 'initial value is less than range.min' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ 0, 1, 2, 11 ]
    } );
  }, 'member of validValues is greater than range.max' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ -1, 0, 1, 2 ]
    } );
  }, 'member of validValues is less than range.min' );
  p = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  p.value = 5;
  window.assert && assert.throws( () => {
    p.value = 11;
  }, 'set value is greater than range.max' );
  window.assert && assert.throws( () => {
    p.value = -1;
  }, 'set value is less than range.min' );

  // units
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { units: 'elephants' } );
  }, 'bad units' );


  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { phetioType: NumberIO } );
  }, 'EnumerationProperty sets phetioType' );

  assert.ok( true, 'one assertion for when assert is not enabled' );
} );


QUnit.test( 'Test NumberProperty range option as Property', assert => {

  let rangeProperty = new Property( new Range( 0, 1 ) );
  let p = null;

  // valueType
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { range: 'hi' } );
  }, 'incorrect range type' );
  p = new NumberProperty( 0, { range: rangeProperty } );
  assert.ok( p.rangeProperty === rangeProperty, 'rangeProperty should be set' );
  assert.ok( p.range === rangeProperty.value, 'rangeProperty value should be set NumberProperty.set on construction' );
  p.value = 1;
  p.value = 0;
  p.value = .5;
  window.assert && assert.throws( () => {
    p.value = 2;
  }, 'larger than range' );
  window.assert && assert.throws( () => {
    p.value = -2;
  }, 'smaller than range' );
  window.assert && assert.throws( () => {
    rangeProperty.value = new Range( 5, 10 );
  }, 'current value outside of range' );

  // reset from previous test setting to [5,10]
  p.dispose();
  rangeProperty.dispose();
  rangeProperty = new Property( new Range( 0, 1 ) );
  p = new NumberProperty( 0, { range: rangeProperty } );
  rangeProperty.value = new Range( 0, 10 );
  p.value = 2;

  p.setValueAndRange( 100, new Range( 99, 101 ) );

  const myRange = new Range( 5, 10 );
  p.setValueAndRange( 6, myRange );

  assert.ok( myRange === p.rangeProperty.value, 'reference should be kept' );

  p = new NumberProperty( 0, { range: new Range( 0, 1 ) } );
  assert.ok( p.rangeProperty instanceof Property, 'created a rangeProperty from a range' );

  // deferring ordering dependencies
  ///////////////////////////////////////////////////////
  let pCalled = 0;
  let pRangeCalled = 0;
  p.lazyLink( () => pCalled++ );
  p.rangeProperty.lazyLink( () => pRangeCalled++ );
  p.setDeferred( true );
  p.rangeProperty.setDeferred( true );
  p.set( 3 );
  assert.ok( pCalled === 0, 'p is still deferred, should not call listeners' );
  p.rangeProperty.set( new Range( 2, 3 ) );
  assert.ok( pRangeCalled === 0, 'p.rangeProperty is still deferred, should not call listeners' );
  const notifyPListeners = p.setDeferred( false );
  notifyPListeners();
  assert.ok( pCalled === 1, 'p listeners should have been called' );
  const notifyRangeListeners = p.rangeProperty.setDeferred( false );
  notifyRangeListeners();
  assert.ok( pRangeCalled === 1, 'p.rangeProperty is still deferred, should not call listeners' );

  p.setValueAndRange( -100, new Range( -101, -99 ) );
  assert.ok( pCalled === 2, 'p listeners should have been called again' );
  assert.ok( pRangeCalled === 2, 'p.rangeProperty is still deferred, should not call listeners again' );

  p = new NumberProperty( 0 );
  p.value = 4;
  assert.ok( p.rangeProperty.value === null, 'rangeProperty should have been created' );
  p.rangeProperty.value = new Range( 0, 4 );
  window.assert && assert.throws( () => {
    p.value = 5;
  }, 'current value outside of range' );
} );
QUnit.test( 'Test NumberProperty phet-io options', assert => {

  const generalTandem = Tandem.GENERAL;
  let p = new NumberProperty( 0, {
    range: new Range( 0, 20 ),
    tandem: generalTandem.createTandem( 'numberProperty' ),
    rangePropertyOptions: { tandem: generalTandem.createTandem( 'rangeProperty' ) }
  } );

  assert.ok( p.rangeProperty.isPhetioInstrumented(), 'rangeProperty instrumented' );
  assert.ok( p.rangeProperty.tandem.name === 'rangeProperty', 'rangeProperty instrumented' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 20 ),
      tandem: generalTandem.createTandem( 'numberProperty2' ),
      rangePropertyOptions: { tandem: generalTandem.createTandem( 'rangePropertyfdsa' ) }
    } );
  }, 'cannot instrument default rangeProperty with tandem other than "rangeProperty"' );
} );