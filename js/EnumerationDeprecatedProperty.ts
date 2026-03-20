// Copyright 2025-2026, University of Colorado Boulder

/**
 * Property whose value is a member of an Enumeration.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import deprecationWarning from '../../phet-core/js/deprecationWarning.js';
import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import merge from '../../phet-core/js/merge.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import axon from './axon.js';
import Property, { PropertyOptions } from './Property.js';

type EnumerationDeprecatedPropertyOptions = StrictOmit<PropertyOptions<object>, 'isValidValue' | 'valueType' >;

/**
 * @deprecated
 */
class EnumerationDeprecatedProperty extends Property<object> {

  /**
   * @param enumeration
   * @param initialValue - one of the values from enumeration
   * @param [options]
   */
  public constructor( public readonly enumeration: EnumerationDeprecated, initialValue: object, options?: EnumerationDeprecatedPropertyOptions ) {
    deprecationWarning( 'Use EnumerationProperty. EnumerationDeprecated should be exchanged for classes that extend EnumerationValue, see WilderEnumerationPatterns for examples.' );

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    assert && assert( enumeration.VALUES.includes( initialValue ), `invalid initialValue: ${initialValue}` );

    if ( options ) {

      // client cannot specify superclass options that are not supported by EnumerationDeprecatedProperty
      assert && assert( !options.hasOwnProperty( 'isValidValue' ), 'EnumerationDeprecatedProperty does not support isValidValue' );

      // client cannot specify superclass options that are controlled by EnumerationDeprecatedProperty
      assert && assert( !options.hasOwnProperty( 'valueType' ), 'EnumerationDeprecatedProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'EnumerationDeprecatedProperty sets phetioType' );
    }

    // eslint-disable-next-line phet/bad-typescript-text
    options = merge( {
      valueType: enumeration,

      // @ts-expect-error
      phetioValueType: EnumerationIO( enumeration ),
      validValues: enumeration.VALUES // for PhET-iO documentation and support
    }, options );

    super( initialValue, options );
  }
}

axon.register( 'EnumerationDeprecatedProperty', EnumerationDeprecatedProperty );
export default EnumerationDeprecatedProperty;