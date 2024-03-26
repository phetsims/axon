// Copyright 2020-2024, University of Colorado Boulder

/**
 * QUnit tests for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import TinyProperty from './TinyProperty.js';

QUnit.module( 'TinyProperty' );

QUnit.test( 'TinyProperty Basics', assert => {
  const property = new TinyProperty( 'x' );
  property.link( value => {
    console.log( value );
  } );

  assert.ok( true, 'one test' );
} );

QUnit.test( 'TinyProperty onBeforeNotify', assert => {

  class MyObservedObject {
    public hasFun: boolean;
    public hadFun: boolean | null;
    public hasFunProperty: TinyProperty<boolean>;

    public constructor() {
      this.hasFun = false;
      this.hadFun = false;
      this.hasFunProperty = new TinyProperty( false, ( newValue, oldValue ) => {
        this.hasFun = newValue;
        this.hadFun = oldValue;
      } );
    }
  }

  const x = new MyObservedObject();

  x.hasFunProperty.lazyLink( ( newValue, oldValue ) => {
    assert.ok( x.hadFun === oldValue, 'old value should match' );
    assert.ok( x.hasFun === newValue, 'new value should match' );
  } );


  x.hasFunProperty.value = true;
  x.hasFunProperty.value = false;
  x.hasFunProperty.value = true;
} );

QUnit.test( 'TinyProperty reentrant notify order (reentrantNotificationStrategy:queue)', assert => {
  let count = 2; // starts as a value of 1, so 2 is the first value we change to.

  // queue is default
  const myProperty = new TinyProperty<number>( 1 );

  myProperty.lazyLink( ( value, oldValue ) => {
    if ( value < 10 ) {
      myProperty.value = value + 1;
      console.log( 'queue:', oldValue, '->', value );
    }
  } );

  // notify-queue:
  // 1->2
  // 2->3
  // 3->4
  // ...
  // 8->9

  myProperty.lazyLink( ( value, oldValue ) => {
    assert.ok( value === oldValue + 1, `increment each time: ${oldValue} -> ${value}` );
    assert.ok( value === count++, `increment by most recent changed: ${count - 2}->${count - 1}, received: ${oldValue} -> ${value}` );
  } );
  myProperty.value = count;
} );

QUnit.test( 'TinyProperty reentrant notify order (reentrantNotificationStrategy:stack)', assert => {
  let count = 2; // starts as a value of 1, so 2 is the first value we change to.
  const finalCount = 10;
  let lastListenerCount = 10;

  const myProperty = new TinyProperty<number>( count - 1, null, null, 'stack' );

  myProperty.lazyLink( ( value, oldValue ) => {
    if ( value < finalCount ) {
      myProperty.value = value + 1;
      console.log( 'stack:', oldValue, '->', value );
    }
  } );

  // stack-notify:
  // 8->9
  // 7->8
  // 6->7
  // ...
  // 1->2
  myProperty.lazyLink( ( value, oldValue ) => {
    count++;
    assert.ok( value === oldValue + 1, `increment each time: ${oldValue} -> ${value}` );
    assert.ok( value === lastListenerCount--, `increment in order expected: ${lastListenerCount}->${lastListenerCount + 1}, received: ${oldValue} -> ${value}` );
    assert.ok( oldValue === lastListenerCount, `new count is ${lastListenerCount}: the oldValue (most recent first in stack first` );
  } );
  myProperty.value = count;
} );


QUnit.test( 'TinyProperty reentrant lazyLinks (reentrantNotificationStrategy:queue)', assert => {

  const myProperty = new TinyProperty<number>( 0, null, null, 'queue' );
  let linkCalledCount = 0;
  let reentered = false;
  myProperty.lazyLink( value => {
    if ( !reentered ) {
      reentered = true;
      myProperty.value = value + 1;

      myProperty.link( newValue => {
        console.log( value, newValue );
        assert.ok( ++linkCalledCount <= 1, 'should not be called from original change, just from link' );
      } );

      // This is great!. It isn't actually like a queue, but how strange it would be to have the above value change trigger
      // this listener because of the queue based reentrant notification strategy. It is better to guard against that so
      // this isn't called on previously called value changes.
      myProperty.lazyLink( () => { assert.ok( false, 'should not be called from original change' ); } );
    }
  } );
  myProperty.value = 1;

  myProperty.removeAllListeners();
/////////////////////////////////////////
  myProperty.value = -1;
  myProperty.lazyLink( originalValue => {

    if ( originalValue < 5 ) {
      let lazyLinkCalledCount = originalValue + 1;
      myProperty.value = originalValue + 1;
      assert.equal( myProperty.value, originalValue + 1, 'value is immediately correct for access (reentrantly)' );
      myProperty.lazyLink( newValue => {
        assert.ok( newValue !== originalValue, `${originalValue}: should not be called from original change` );
        assert.equal( newValue, ++lazyLinkCalledCount, `${lazyLinkCalledCount}: should be called in order (lazyLink)` );
      } );
    }
  } );
  myProperty.value = 0;
} );