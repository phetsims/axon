// Copyright 2019-2020, University of Colorado Boulder

/**
 * QUnit tests for EmitterIO
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../phet-core/js/merge.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import Emitter from './Emitter.js';
import EmitterIO from './EmitterIO.js';

QUnit.module( 'EmitterIO' );

QUnit.test( 'test EmitterIO', assert => {

  let emitter = null;

  if ( window.assert ) {

    assert.throws( () => {
      emitter = new Emitter( {
        phetioType: EmitterIO( [] )
      } );
    }, 'cannot supply default EmitterIO type' );

    assert.throws( () => {
      emitter = new Emitter( {
        phetioType: ObjectIO
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


  const validator = { isValidValue: v => v < 3 };
  emitter = new Emitter( {
    parameters: [ merge( { phetioType: NumberIO, name: 'helloIAMNumber' }, validator ) ]
  } );
  assert.ok( emitter._parameters[ 0 ].isValidValue === validator.isValidValue, 'should use specified validator instead of NumberIO\'s' );
  emitter.emit( 2 );
  window.assert && assert.throws( () => emitter.emit( 'string' ), 'cannot emit string with validator' );
  window.assert && assert.throws( () => emitter.emit( 'a' ), 'cannot emit string with  that validator' );
  window.assert && assert.throws( () => emitter.emit( 4 ), 'cannot emit incorrect number' );
} );