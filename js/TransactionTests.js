// Copyright 2019, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const DerivedProperty = require( 'AXON/DerivedProperty' );
  const DerivedPropertyIO = require( 'AXON/DerivedPropertyIO' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Tandem = require( 'TANDEM/Tandem' );
  var Transaction = require( 'AXON/Transaction' );

  QUnit.module( 'Transaction' );

  QUnit.test( 'basic tests', function( assert ) {
    assert.ok( true, 'token test' );
    const a = new NumberProperty( 0, { tandem: Tandem.generalTandem.createTandem( 'aProperty' ) } );
    const b = new NumberProperty( 0, { tandem: Tandem.generalTandem.createTandem( 'bProperty' ) } );
    const sum = new DerivedProperty( [ a, b ], ( a, b ) => a + b, {
      phetioType: DerivedPropertyIO( NumberIO ),
      tandem: Tandem.generalTandem.createTandem( 'sumProperty' )
    } );

    const transaction = new Transaction( [ a, b, sum ] ).start();
    const log = [];
    a.lazyLink( a => log.push( 'a changed to ' + a ) );
    b.lazyLink( b => log.push( 'b changed to ' + b ) );
    sum.lazyLink( sum => log.push( 'sum changed to ' + sum ) );

    a.value = 1;
    b.value = 2;
    a.value = 5;
    b.value = 3;
    assert.equal( log.length, 0, 'nothing should be logged yet' );
    transaction.end();
    assert.equal( log.length, 3, 'should have received 3 messages' );

    // phet-io data stream:
    // a changed to 5
    // b changed to 3
    // sum changed 8
    // d changed to 20
  } );

  // Make sure that one Property can be in a transaction while another is not.
  // TODO #244 add this test
  // QUnit.test( 'Test two-Property transactions', function( assert ) {
  //   var p1 = new Property( 1 );
  //   var p2 = new Property( 2 );
  //   var callbacks = 0;
  //
  //   p1.lazyLink( function( newValue, oldValue ) {
  //     p2.value = newValue * 20;
  //   } );
  //   p1.startTransaction();
  //   p1.set( 2 );
  //   assert.equal( p2.value, p2._initialValue, 'p2 should still equal its initial value' );
  //
  //   p2.lazyLink( function( newValue, oldValue ) {
  //     callbacks++;
  //     p1.value = newValue * 10;
  //   } );
  //   var p2NewValue = 3;
  //   p2.set( p2NewValue );
  //   assert.equal( p2.value, p2NewValue, 'p2 should not have called p1\'s listeners' );
  //   assert.equal( callbacks, 1, 'should not update value more than once' );
  // } );

} );