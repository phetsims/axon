// Copyright 2016-2021, University of Colorado Boulder

/**
 * Property whose value must be a string.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import merge from '../../phet-core/js/merge.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import Property from './Property.js';

// constants
const StringPropertyIO = Property.PropertyIO( StringIO );

class StringProperty extends Property {

  /**
   * @param {string} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  constructor( value, options ) {

    // client cannot specify superclass options that are controlled by StringProperty
    if ( options ) {
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'StringProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'StringProperty sets phetioType' );
    }

    // Fill in superclass options that are controlled by StringProperty.
    options = merge( {
      valueType: 'string',
      phetioType: StringPropertyIO
    }, options );

    super( value, options );
  }
}

axon.register( 'StringProperty', StringProperty );
export default StringProperty;