// Copyright 2017, University of Colorado Boulder

/**
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var BooleanProperty = require( 'AXON/BooleanProperty' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @constructor
   */
  var BooleanPropertyTests = {
    runTests: function() {
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
    }
  };
  axon.register( 'BooleanPropertyTests', BooleanPropertyTests );

  return inherit( Object, BooleanPropertyTests );
} );