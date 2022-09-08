// Copyright 2019-2022, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationDeprecatedProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import EnumerationDeprecatedProperty from './EnumerationDeprecatedProperty.js';

QUnit.module( 'EnumerationDeprecatedProperty' );
QUnit.test( 'EnumerationDeprecatedProperty', assert => {

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  let birdProperty = null;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( true );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty.set( Birds.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {
    birdProperty.set( 5 );
  }, 'bad set value' );

  // superclass options that are not supported by EnumerationDeprecatedProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { isValidValue: () => true } );
  }, 'EnumerationDeprecatedProperty does not support isValidValue' );

  // superclass options that are controlled by EnumerationDeprecatedProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { valueType: Birds } );
  }, 'EnumerationDeprecatedProperty sets valueType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationDeprecatedProperty sets phetioType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, { phetioType: EnumerationIO } );
  }, 'Did not include initial value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( {} );
  }, 'That is not an enumeration' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    const Birds1 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER' ] );
    const Birds2 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER1' ], { phetioDocumentation: 'the second one' } );
    assert.ok( Birds1 !== Birds2, 'different Enumerations' );
    assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );
    let birdProperty = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN );
    const birdProperty2 = new EnumerationDeprecatedProperty( Birds2, Birds2.ROBIN );

    // constructor value
    window.assert && assert.throws( () => {
      birdProperty.set( Birds2.ROBIN );
    }, 'cannot use same string value from other EnumerationDeprecated instance' );

    // new instance of birdProperty since it got messed up in the above assert.
    birdProperty = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN );

    birdProperty.set( Birds1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    birdProperty2.set( Birds2.WREN );
  }
);

QUnit.test( 'validValues as a subset of EnumerationDeprecated values', assert => {

  const Birds1 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  const Birds2 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER2' ], { phetioDocumentation: 'the second one' } );
  assert.ok( Birds1 !== Birds2, 'different Enumerations' );
  assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );


  const enumerationProperty1 = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN, { validValues: [ Birds1.ROBIN, Birds1.JAY ] } );

  enumerationProperty1.value = Birds1.JAY;
  assert.ok( enumerationProperty1.value === Birds1.JAY, 'basic test for when assertions are not enabled' );
  assert.ok( enumerationProperty1.getInitialValue() === Birds1.ROBIN, 'basic test for when assertions are not enabled for initialValue' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Birds1.WREN;
  }, 'not a valid value' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Birds2.ROBIN;
  }, 'not a valid value, from a different EnumerationDeprecated' );

} );