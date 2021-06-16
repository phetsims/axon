// Copyright 2017-2021, University of Colorado Boulder

/**
 * QUnit tests for DerivedProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import DerivedProperty from './DerivedProperty.js';
import Property from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';

QUnit.module( 'DerivedProperty' );

QUnit.test( 'Test stale values in DerivedProperty', assert => {
  const a = new Property( 1 );
  const b = new Property( 2 );
  const c = new DerivedProperty( [ a, b ], ( ( a, b ) => {return a + b;} ) );
  a.value = 7;
  assert.equal( c.value, 9 );
} );

QUnit.test( 'Test DerivedProperty.unlink', assert => {

  const widthProperty = new Property( 2 );
  const startingWidthListenerCount = widthProperty.getListenerCount();
  const heightProperty = new Property( 3 );
  const startingHeightListenerCount = heightProperty.getListenerCount();
  const areaProperty = new DerivedProperty( [ widthProperty, heightProperty ],
    ( ( width, height ) => width * height ) );
  const listener = function( area ) { /*console.log( 'area = ' + area );*/ };
  areaProperty.link( listener );

  assert.equal( widthProperty.getListenerCount(), 1 + startingWidthListenerCount );
  assert.equal( heightProperty.getListenerCount(), 1 + startingHeightListenerCount );
  assert.equal( areaProperty.dependencies.length, 2 );

  // Unlink the listener
  areaProperty.unlink( listener );
  areaProperty.dispose();

  assert.equal( widthProperty.getListenerCount(), startingWidthListenerCount );
  assert.equal( heightProperty.getListenerCount(), startingHeightListenerCount );

  assert.equal( areaProperty.dependencies, null );
  assert.equal( areaProperty.dependencyListeners, null );
  assert.equal( areaProperty.dependencyValues, null );
} );

QUnit.test( 'DerivedProperty.valueEquals', assert => {
  const propA = new Property( 'a' );
  const propB = new Property( 'b' );
  const prop = DerivedProperty.valueEquals( propA, propB );
  assert.equal( prop.value, false );
  propA.value = 'b';
  assert.equal( prop.value, true );
} );

QUnit.test( 'Test defer', assert => {
  const property1 = new Property( 0 );
  const property2 = new Property( 2 );
  const derivedProperty = new DerivedProperty( [ property1, property2 ], ( a, b ) => a + b );
  assert.ok( derivedProperty.value === 2, 'base case, no defer' );

  // test a dependency being deferred
  property1.setDeferred( true );
  assert.ok( derivedProperty.value === 2, 'same value even after defer' );
  property1.value = 2;
  assert.ok( derivedProperty.value === 2, 'same value even when set to new' );
  const update = property1.setDeferred( false );
  assert.ok( property1.value === 2, 'property has new value now' );
  assert.ok( derivedProperty.value === 2, 'but the derivedProperty doesnt' );
  update();
  assert.ok( derivedProperty.value === 4, 'now derivedProperty was updated' );

  // test the DerivedProperty being deferred
  derivedProperty.setDeferred( true );
  assert.ok( derivedProperty.value === 4, 'still 4' );
  property1.value = 4;
  assert.ok( derivedProperty.value === 4, 'still 4 after update' );
  const updateAgain = derivedProperty.setDeferred( false );
  assert.ok( derivedProperty.value === 6, 'now has the correct value' );
  updateAgain();
  assert.ok( derivedProperty.value === 6, 'nothing changed' );
} );

QUnit.test( 'DerivedProperty and/or', assert => {

  const propA = new Property( false );
  const propB = new Property( false );
  const propC = new Property( false );
  const propD = new Property( 0 ); // dependency with an invalid (non-boolean) type

  // fail: 'and' with non-boolean Property
  window.assert && assert.throws( () => DerivedProperty.and( [ propA, propD ] ),
    'DerivedProperty.and requires booleans Property values' );

  // fail: 'or' with non-boolean Property
  window.assert && assert.throws( () => DerivedProperty.or( [ propA, propD ] ),
    'DerivedProperty.or requires booleans Property values' );

  // correct usages of 'and' and 'or'
  const and = DerivedProperty.and( [ propA, propB, propC ] );
  const or = DerivedProperty.or( [ propA, propB, propC ] );

  assert.equal( and.value, false );
  assert.equal( or.value, false );

  propA.value = true;
  assert.equal( and.value, false );
  assert.equal( or.value, true );

  propB.value = true;
  assert.equal( and.value, false );
  assert.equal( or.value, true );

  propC.value = true;
  assert.equal( and.value, true );
  assert.equal( or.value, true );

  // fail: setting a dependency to a non-boolean value
  window.assert && assert.throws( () => { propA.value = 0; },
    'DerivedProperty dependency must have boolean value' );
} );

if ( Tandem.PHET_IO_ENABLED ) {
  QUnit.test( 'propertyStateHandlerSingleton tests for DerivedProperty', assert => {

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
    const thirdProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'thirdProperty' ),
      phetioType: Property.PropertyIO( NumberIO )
    } );

    const derivedProperty = new DerivedProperty( [ firstProperty, secondProperty, thirdProperty ], () => 3, {
      tandem: parentTandem.createTandem( 'derivedProperty' ),
      phetioType: DerivedProperty.DerivedPropertyIO( NumberIO )
    } );
    assert.ok( getOrderDependencyLength() === 3, 'derivedProperty adds order dependency for each dependency' );

    firstProperty.dispose();
    assert.ok( getOrderDependencyLength() === 2, 'dependency dispose only removes what it effects' );
    derivedProperty.dispose();
    assert.ok( getOrderDependencyLength() === 0, 'no orderDependencies after derivedProperty dispose' );

    secondProperty.dispose();
    thirdProperty.dispose();
  } );
}