// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for DerivedProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import PropertyIO from './PropertyIO.js';

// constants
const PROPERTY_IO_VALIDATOR = {
  isValidValue: v => {
    const DerivedProperty = window.phet ? phet.axon.DerivedProperty : axon.DerivedProperty;
    return v instanceof DerivedProperty;
  }
};

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized DerivedPropertyIO so that
// it is only created once.
const cache = {};

/**
 * Parametric IO type constructor.  Given an parameter type, this function returns an appropriate DerivedProperty
 * IO type. Unlike PropertyIO, DerivedPropertyIO cannot be set by PhET-iO clients.
 * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function DerivedPropertyIO( parameterType ) {
  assert && assert( parameterType, 'DerivedPropertyIO needs parameterType' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a ObservableArrayIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  // The parent type is also parameterized, so we have to instantiate it before we can extend it.
  const PropertyIOImpl = PropertyIO( parameterType );

  /**
   * This type constructor is parameterized based on the parameterType.
   *
   * @param {DerivedProperty} derivedProperty
   * @param {string} phetioID
   * @constructor
   */
  class DerivedPropertyIOImpl extends PropertyIOImpl {}

  DerivedPropertyIOImpl.methods = {
    setValue: {
      returnType: VoidIO,
      parameterTypes: [ parameterType ],
      implementation: function( value ) {
        return this.phetioObject.set( value );
      },
      documentation: 'Errors out when you try to set a derived property.',
      invocableForReadOnlyElements: false
    }
  };
  DerivedPropertyIOImpl.documentation = 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                                        'instances';
  DerivedPropertyIOImpl.validator = PROPERTY_IO_VALIDATOR;
  DerivedPropertyIOImpl.typeName = `DerivedPropertyIO<${parameterType.typeName}>`;

  // @public - allow type checking for DerivedPropertyIOImpl
  DerivedPropertyIOImpl.outerType = DerivedPropertyIO;
  ObjectIO.validateSubtype( DerivedPropertyIOImpl );

  return DerivedPropertyIOImpl;
};

axon.register( 'DerivedPropertyIO', DerivedPropertyIO );
export default DerivedPropertyIO;