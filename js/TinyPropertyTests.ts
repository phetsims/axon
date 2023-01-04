// Copyright 2020-2023, University of Colorado Boulder

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

  // TODO: what is this testing? https://github.com/phetsims/axon/issues/421
  // x.hasFunProperty.value = 42;
  // x.hasFunProperty.value = 'duh';
  // x.hasFunProperty.value = 'always';
} );