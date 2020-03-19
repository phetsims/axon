// Copyright 2019-2020, University of Colorado Boulder

/**
 * Property whose value is a member of an Enumeration.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationIO from '../../phet-core/js/EnumerationIO.js';
import merge from '../../phet-core/js/merge.js';
import axon from './axon.js';
import Property from './Property.js';
import PropertyIO from './PropertyIO.js';

class EnumerationProperty extends Property {

  /**
   * @param {Enumeration} enumeration
   * @param {*} initialValue - one of the values from enumeration
   * @param {Object} [options]
   */
  constructor( enumeration, initialValue, options ) {

    assert && assert( enumeration instanceof Enumeration, `invalid enumeration: ${enumeration}` );
    assert && assert( enumeration.includes( initialValue ), `invalid initialValue: ${initialValue}` );

    if ( options ) {

      // client cannot specify superclass options that are not supported by EnumerationProperty
      assert && assert( !options.hasOwnProperty( 'isValidValue' ), 'EnumerationProperty does not support isValidValue' );

      // client cannot specify superclass options that are controlled by EnumerationProperty
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'EnumerationProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'EnumerationProperty sets phetioType' );
    }

    options = merge( {
      valueType: enumeration,
      phetioType: PropertyIO( EnumerationIO( enumeration ) ),
      validValues: enumeration.VALUES // for PhET-iO documentation and support
    }, options );

    super( initialValue, options );

    // @public (read-only)
    this.enumeration = enumeration;
  }
}

axon.register( 'EnumerationProperty', EnumerationProperty );
export default EnumerationProperty;