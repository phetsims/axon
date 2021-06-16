// Copyright 2017-2021, University of Colorado Boulder

/**
 * QUnit tests for StringProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import StringIO from '../../tandem/js/types/StringIO.js';
import StringProperty from './StringProperty.js';

QUnit.module( 'StringProperty' );
QUnit.test( 'Test StringProperty', assert => {

  let p = null;

  // valueType
  window.assert && assert.throws( () => {
    p = new StringProperty( 'foo', { valueType: 'string' } );
  }, 'valueType cannot be set by client' );
  p = new StringProperty( 'foo' );
  p.value = 'bar';
  window.assert && assert.throws( () => {
    p.value = 0;
  }, 'set value fails valueType test' );

  // validValues
  window.assert && assert.throws( () => {
    p = new StringProperty( 'bad', {
      validValues: [ 'foo', 'bar' ]
    } );
  }, 'initial value is not a member of validValues' );
  window.assert && assert.throws( () => {
    p = new StringProperty( 'foo', {
      validValues: [ 'foo', 'bar', 0 ]
    } );
  }, 'member of validValues has incorrect valueType' );
  window.assert && assert.throws( () => {
    p = new StringProperty( 'foo', {
      validValues: [ 'foo', 'bar' ],
      isValidValue: function( value ) { return value[ 0 ] === 'f'; }
    } );
  }, 'member of validValues fails isValidValue test' );
  p = new StringProperty( 'foo', {
    validValues: [ 'foo', 'bar' ]
  } );
  p.value = 'bar';
  window.assert && assert.throws( () => {
    p.value = 'bad';
  }, 'set value is not a member of validValues' );

  // isValidValue
  p = new StringProperty( 'foo', {
    isValidValue: function( value ) { return value[ 0 ] === 'f'; }
  } );
  p.value = 'five';
  window.assert && assert.throws( () => {
    p.value = 'bad';
  }, 'set value fails isValidValue test' );

  // multiple compatible options
  p = new StringProperty( 'foo', {
    validValues: [ 'foo', 'bar' ],
    isValidValue: function( value ) { return value.length === 3; }
  } );

  // multiple incompatible options
  window.assert && assert.throws( () => {
    p = new StringProperty( 'foo', {
      validValues: [ 'foo', 'bar' ],
      isValidValue: function( value ) { return value.length === 4; }
    } );
  }, 'incompatible validation options fail on initialization' );

  window.assert && assert.throws( () => {
    p = new StringProperty( 'hello', { phetioType: StringIO } );
  }, 'EnumerationProperty sets phetioType' );

  assert.ok( true, 'so we have at least 1 test in this set' );
} );