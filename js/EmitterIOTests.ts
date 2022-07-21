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

  let emitter: Emitter | null = null;

  if ( window.assert ) {

    assert.throws( () => {
      emitter = new Emitter( {

        // @ts-ignore
        phetioType: Emitter.EmitterIO( [] )
      } );
    }, 'cannot supply default EmitterIO type' );

    assert.throws( () => {
      emitter = new Emitter( {
        // @ts-ignore
        phetioType: IOType.ObjectIO
      } );
      console.log( emitter );
    }, 'cannot supply any phetioType' );
  }

  let emitter2 = new Emitter<[ number ]>( {
    parameters: [
      { phetioType: NumberIO, name: 'myNumber' }
    ]
  } );
  emitter2.emit( 4 );
  emitter2.emit( 10 );
  // @ts-ignore
  window.assert && assert.throws( () => emitter2.emit( 'string' ), 'cannot emit string' );
  // @ts-ignore
  window.assert && assert.throws( () => emitter2.emit( null ), 'cannot emit string' );

  const validator = { isValidValue: ( v: number ) => v < 3 };
  emitter2 = new Emitter<[ number ]>( {

    // @ts-ignore
    parameters: [ merge( { phetioType: NumberIO, name: 'helloIAMNumber' }, validator ) ]
  } );

  // @ts-ignore
  assert.ok( emitter2!.parameters[ 0 ].isValidValue === validator.isValidValue, 'should use specified validator instead of NumberIO\'s' );
  emitter2!.emit( 2 );

  // @ts-ignore
  window.assert && assert.throws( () => emitter2!.emit( 'string' ), 'cannot emit string with validator' );
  // @ts-ignore
  window.assert && assert.throws( () => emitter2!.emit( 'a' ), 'cannot emit string with  that validator' );
  window.assert && assert.throws( () => emitter2!.emit( 4 ), 'cannot emit incorrect number' );
} );