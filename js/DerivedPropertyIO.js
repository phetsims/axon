// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO Type for DerivedProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import PropertyIO from './PropertyIO.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized DerivedPropertyIO so that
// it is only created once.
const cache = {};

/**
 * Parametric IO Type constructor.  Given an parameter type, this function returns an appropriate DerivedProperty
 * IO Type. Unlike PropertyIO, DerivedPropertyIO cannot be set by PhET-iO clients.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function DerivedPropertyIO( parameterType ) {
  assert && assert( parameterType, 'DerivedPropertyIO needs parameterType' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = new IOType( `DerivedPropertyIO<${parameterType.typeName}>`, {
      isValidValue: v => {
        const DerivedProperty = window.phet ? phet.axon.DerivedProperty : axon.DerivedProperty;
        return v instanceof DerivedProperty;
      },

      // REVIEW: https://github.com/phetsims/tandem/issues/211 should this inherit, so you don't have to specify it in the subclass if a parent class already specified it?
      parameterTypes: [ parameterType ],
      supertype: PropertyIO( parameterType ),
      documentation: 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                     'instances',
      // Override the parent implementation as a no-op.  DerivedProperty values appear in the state, but should not be set
      // back into a running simulation. See https://github.com/phetsims/phet-io/issues/1292
      applyState: () => { },
      methods: {
        setValue: {
          returnType: VoidIO,
          parameterTypes: [ parameterType ],
          implementation: function( value ) {
            return this.set( value );
          },
          documentation: 'Errors out when you try to set a derived property.',
          invocableForReadOnlyElements: false
        }
      }
    } );
  }

  return cache[ parameterType.typeName ];
}

axon.register( 'DerivedPropertyIO', DerivedPropertyIO );
export default DerivedPropertyIO;