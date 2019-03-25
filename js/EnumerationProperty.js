// Copyright 2019, University of Colorado Boulder

/**
 * Property whose value is a member of an Enumeration.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const EnumerationIO = require( 'PHET_CORE/EnumerationIO' );
  const Property = require( 'AXON/Property' );
  const PropertyIO = require( 'AXON/PropertyIO' );

  class EnumerationProperty extends Property {

    /**
     * @param {Enumeration} enumeration
     * @param {*} initialValue - one of the values from enumeration
     * @param {Object} [options]
     */
    constructor( enumeration, initialValue, options ) {

      if ( options ) {

        // client cannot specify superclass options that are not supported by EnumerationProperty
        assert && assert( options.hasOwnProperty( 'isValidValue' ), 'EnumerationProperty does not support isValidValue' );
        assert && assert( options.hasOwnProperty( 'valueType' ), 'EnumerationProperty does not support valueType' );

        // client cannot specify superclass options that are controlled by EnumerationProperty
        assert && assert( options.hasOwnProperty( 'validValues' ), 'EnumerationProperty sets validValues' );
        assert && assert( options.hasOwnProperty( 'phetioType' ), 'EnumerationProperty sets phetioType' );
      }

      options = _.extend( {
        validValue: enumeration.VALUES,
        phetioType: PropertyIO( EnumerationIO( enumeration ) )
      }, options );

      super( initialValue, options);

      // @public (read-only)
      this.enumeration = enumeration;
    }
  }

  return axon.register( 'EnumerationProperty', EnumerationProperty );
} );