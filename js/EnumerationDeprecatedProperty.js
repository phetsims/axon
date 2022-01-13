// Copyright 2019-2022, University of Colorado Boulder

/**
 * Property whose value is a member of an Enumeration.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import merge from '../../phet-core/js/merge.js';
import axon from './axon.js';
import Property from './Property.js';

class EnumerationDeprecatedProperty extends Property {

  /**
   * @param {EnumerationDeprecated} enumeration
   * @param {*} initialValue - one of the values from enumeration
   * @param {Object} [options]
   */
  constructor( enumeration, initialValue, options ) {
    assert && assert( enumeration.VALUES.includes( initialValue ), `invalid initialValue: ${initialValue}` );

    if ( options ) {

      // client cannot specify superclass options that are not supported by EnumerationDeprecatedProperty
      assert && assert( !options.hasOwnProperty( 'isValidValue' ), 'EnumerationDeprecatedProperty does not support isValidValue' );

      // client cannot specify superclass options that are controlled by EnumerationDeprecatedProperty
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'EnumerationDeprecatedProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'EnumerationDeprecatedProperty sets phetioType' );
    }

    options = merge( {
      valueType: enumeration,
      phetioType: Property.PropertyIO( EnumerationIO( enumeration ) ),
      validValues: enumeration.VALUES // for PhET-iO documentation and support
    }, options );

    super( initialValue, options );

    // @public (read-only)
    this.enumeration = enumeration;
  }
}

axon.register( 'EnumerationDeprecatedProperty', EnumerationDeprecatedProperty );
export default EnumerationDeprecatedProperty;