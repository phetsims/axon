// Copyright 2019-2020, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationIO from '../../phet-core/js/EnumerationIO.js';
import EnumerationProperty from './EnumerationProperty.js';

QUnit.module( 'EnumerationProperty' );
QUnit.test( 'EnumerationProperty', function( assert ) {

  const Birds = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  let birdProperty = null;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( true );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty.set( Birds.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {
    birdProperty.set( 5 );
  }, 'bad set value' );

  // superclass options that are not supported by EnumerationProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { isValidValue: () => true } );
  }, 'EnumerationProperty does not support isValidValue' );

  // superclass options that are controlled by EnumerationProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { valueType: Birds } );
  }, 'EnumerationProperty sets valueType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationProperty sets phetioType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, { phetioType: EnumerationIO } );
  }, 'Did not include initial value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( {} );
  }, 'That is not an enumeration' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    const Birds1 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
    const Birds2 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ], { phetioDocumentation: 'the second one' } );
    assert.ok( Birds1 !== Birds2, 'different Enumerations' );
    assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );
    let birdProperty = new EnumerationProperty( Birds1, Birds1.ROBIN );
    const birdProperty2 = new EnumerationProperty( Birds2, Birds2.ROBIN );

    // constructor value
    window.assert && assert.throws( () => {
      birdProperty.set( Birds2.ROBIN );
    }, 'cannot use same string value from other Enumeration instance' );

    // new instance of birdProperty since it got messed up in the above assert.
    birdProperty = new EnumerationProperty( Birds1, Birds1.ROBIN );

    birdProperty.set( Birds1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    birdProperty2.set( Birds2.WREN );
  }
);

QUnit.test( 'validValues as a subset of Enumeration values', assert => {

  const Birds1 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  const Birds2 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ], { phetioDocumentation: 'the second one' } );
  assert.ok( Birds1 !== Birds2, 'different Enumerations' );
  assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );


  const enumerationProperty1 = new EnumerationProperty( Birds1, Birds1.ROBIN, { validValues: [ Birds1.ROBIN, Birds1.JAY ] } );

  enumerationProperty1.value = Birds1.JAY;
  assert.ok( enumerationProperty1.value === Birds1.JAY, 'basic test for when assertions are not enabled' );
  assert.ok( enumerationProperty1.getInitialValue() === Birds1.ROBIN, 'basic test for when assertions are not enabled for initialValue' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Birds1.WREN;
  }, 'not a valid value' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Birds2.ROBIN;
  }, 'not a valid value, from a different Enumeration' );

} );