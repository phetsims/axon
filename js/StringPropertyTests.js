// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for StringProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var StringProperty = require( 'AXON/StringProperty' );

  QUnit.module( 'StringProperty' );
  QUnit.test( 'Test StringProperty', function( assert ) {

    var p = new StringProperty( 'foo' );
    p.value = 'bar';

    // default validation
    window.assert && assert.throws( function() {
      p.value = 0;
    }, 'should throw Assertion failed: invalid value: 0' );

    // validValues
    p = new StringProperty( 'foo', {
      validValues: [ 'foo', 'bar' ]
    } );
    p.value = 'bar';
    window.assert && assert.throws( function() {
      p.value = 'bad';
    }, 'should throw Assertion failed: invalid value: bad' );

    // isValidValue
    p = new StringProperty( 'foo', {
      isValidValue: function( value ) { return value[ 0 ] === 'f'; } // beings with 'f'
    } );
    p.value = 'five';
    window.assert && assert.throws( function() {
      p.value = 'bad';
    }, 'should throw Assertion failed: invalid value: bad' );

    // mutually exclusive options
    window.assert && assert.throws( function() {
      p = new StringProperty( 'foo', {
        validValues: [ 'foo', 'bar' ],
        isValidValue: function( value ) { return value[ 0 ] === 'f'; }
      } );
    }, 'should throw Assertion failed: validValues and isValidValue are mutually exclusive' );

    if ( !window.assert ) {
      assert.expect( 0 );
    }
  } );

} );