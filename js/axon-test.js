// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests for axon. Please run once in phet brand and once in brand=phet-io to cover all functionality.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var ObjectStateIO = require( 'ifphetio!PHET_IO/types/ObjectStateIO' );
  var Property = require( 'AXON/Property' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var Tandem = require( 'TANDEM/Tandem' );

  QUnit.test( 'axon', function( assert ) {
    assert.ok( true, 'initial test' );
  } );

  // Tests that can only run in phet-io mode
  if ( window.phet.phetio ) {
    QUnit.test( 'Test PropertyIO toStateObject/fromStateObject', function( assert ) {
      var tandem = Tandem.rootTandem.createTandem( 'testTandem' );
      tandem.addInstance = function( instance, options ) {
        var stateObject = ObjectStateIO.toStateObject( instance );
        assert.equal( stateObject.value, 0, 'toStateObject should match' );
      };
      var property = new Property( 0, {
        phetioType: PropertyIO( ObjectStateIO ),
        tandem: tandem,
        validValues: [ 0, 1, 2, 3 ]
      } );
      assert.ok( property, 'property should exist' );
    } );
  }
} );