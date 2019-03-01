// Copyright 2019, University of Colorado Boulder

/**
 * QUnit tests for EmitterIO
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Emitter = require( 'AXON/Emitter' );
  const EmitterIO = require( 'AXON/EmitterIO' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );

  QUnit.module( 'EmitterIO' );

  QUnit.test( 'test EmitterIO', assert => {

    let emitter = null;

    if ( window.assert ) {

      assert.throws( () => {
        emitter = new Emitter( {
          validators: [ { valueType: 'number' } ],
          phetioType: EmitterIO( [ { type: NumberIO } ] )
        } );
      }, 'cannot supply phetioType and validators' );

      assert.throws( () => {
        emitter = new Emitter( {
          phetioType: EmitterIO( [] )
        } );
      }, 'cannot supply default EmitterIO type' );
    }

    emitter = new Emitter( {
      phetioType: EmitterIO( [ { type: NumberIO } ] )
    } );
    assert.ok( emitter.validators[ 0 ] === NumberIO.validator, 'should use NumberIO\'s validator' );
    emitter.emit( 4 );
    emitter.emit( 10 );
    window.assert && assert.throws( () => emitter.emit( 'string' ), 'cannot emit string' );
    window.assert && assert.throws( () => emitter.emit( null ), 'cannot emit string' );


    const validator = { isValidValue: v => v < 3 };
    emitter = new Emitter( {
      phetioType: EmitterIO( [ { type: NumberIO, validator: validator } ] )
    } );
    assert.ok( emitter.validators[ 0 ] === validator, 'should use specified validator instead of NumberIO\'s' );
    emitter.emit( 2 );
    window.assert && assert.throws( () => emitter.emit( 'string' ), 'cannot emit string with validator' );
    window.assert && assert.throws( () => emitter.emit( 4 ), 'cannot emit incorrect number' );
  } );
} );