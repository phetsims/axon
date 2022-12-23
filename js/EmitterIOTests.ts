// Copyright 2019-2022, University of Colorado Boulder

/**
 * QUnit tests for EmitterIO
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import Emitter from './Emitter.js';

QUnit.module( 'EmitterIO' );

QUnit.test( 'test EmitterIO', assert => {

  let emitter: Emitter<[ unknown ]>;

  if ( window.assert ) {

    assert.throws( () => {
      emitter = new Emitter( {

        // @ts-expect-error INTENTIONAL, force set phetioType for testing
        phetioType: Emitter.EmitterIO( [] )
      } );
    }, 'cannot supply default EmitterIO type' );

    assert.throws( () => {
      emitter = new Emitter( {

        // @ts-expect-error INTENTIONAL, force set phetioType for testing
        phetioType: IOType.ObjectIO
      } );
    }, 'cannot supply any phetioType' );
  }

  emitter = new Emitter( {
    parameters: [
      { phetioType: NumberIO, name: 'myNumber' }
    ]
  } );
  emitter.emit( 4 );
  emitter.emit( 10 );
  window.assert && assert.throws( () => emitter.emit( 'string' ), 'cannot emit string' );
  window.assert && assert.throws( () => emitter.emit( null ), 'cannot emit string' );

  const validator = { isValidValue: ( v: unknown ) => typeof v === 'number' && v < 3 };
  emitter = new Emitter( {
    parameters: [ merge( { phetioType: NumberIO, name: 'helloIAMNumber' }, validator ) ]
  } );
  assert.ok( emitter[ 'parameters' ][ 0 ].isValidValue === validator.isValidValue, 'should use specified validator instead of NumberIO\'s' );
  emitter.emit( 2 );
  window.assert && assert.throws( () => emitter.emit( 'string' ), 'cannot emit string with validator' );
  window.assert && assert.throws( () => emitter.emit( 'a' ), 'cannot emit string with  that validator' );
  window.assert && assert.throws( () => emitter.emit( 4 ), 'cannot emit incorrect number' );

  if ( !window.assert ) {
    const IOType = Emitter.EmitterIO( [ NumberIO ] );
    IOType.methods!.emit.implementation.call( emitter, 2 );

    assert.throws( () => IOType.methods!.emit.implementation.call( emitter, 4 ), 'cannot emit incorrect number' );
  }
} );