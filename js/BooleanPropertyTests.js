// Copyright 2017, University of Colorado Boulder

/**
 * QUnit Tests for BooleanProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var BooleanProperty = require( 'AXON/BooleanProperty' );

  QUnit.module( 'BooleanProperty' );
  QUnit.test( 'BooleanProperty', function( assert ) {
    window.assert && assert.throws( function() {
      new BooleanProperty( 'hello' ); //eslint-disable-line
    }, 'invalid initial value for BooleanProperty' ); // eslint-disable-line
    var c = new BooleanProperty( true );
    c.set( true );
    c.set( false );
    c.set( true );
    window.assert && assert.throws( function() {
      c.set( 123 );
    }, 'set an invalid value for BooleanProperty' );

    if ( !window.assert ) {
      assert.expect( 0 );
    }
  } );
} );