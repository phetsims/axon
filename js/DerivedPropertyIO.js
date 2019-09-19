// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for DerivedProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const PropertyIO = require( 'AXON/PropertyIO' );
  const VoidIO = require( 'TANDEM/types/VoidIO' );

  // constants
  const PROPERTY_IO_VALIDATOR = {
    isValidValue: v => {
      const DerivedProperty = window.phet ? phet.axon.DerivedProperty : axon.DerivedProperty;
      return v instanceof DerivedProperty;
    }
  };

  /**
   * Parametric IO type constructor.  Given an value type, this function returns an appropriate DerivedProperty IO type.
   *
   * @param {function} parameterType - phet-io type wrapper like StringIO, NumberIO, etc. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   */
  function DerivedPropertyIO( parameterType ) {
    assert && assert( !!parameterType, 'DerivedPropertyIO needs parameterType' );
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
  }

  return axon.register( 'DerivedPropertyIO', DerivedPropertyIO );
} );