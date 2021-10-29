// Copyright 2018-2021, University of Colorado Boulder

/**
 * IO Type for phet-core Enumeration that supports serializing and deserializing values. Cannot be moved to the core
 * type since Enumeration must be defined before ValidatorDef can be defined.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import StateSchema from '../../../../tandem/js/types/StateSchema.js';

// {Map.<enumeration:Enumeration, IOType>} - Cache each parameterized RichEnumuerationIO so that it is only created once.
const cache = new Map();

/**
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 */
const RichEnumuerationIO = <T>( enumeration: T, keys: string[], values: T[] ): IOType => {

  if ( !cache.has( enumeration ) ) {
    const getKey = ( value: T ) => keys.find( key =>

      // @ts-ignore
      enumeration[ key ] === value );

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = 'docs';//enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    cache.set( enumeration, new IOType( `RichEnumuerationIO(${keys.join( '|' )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: getKey,
      fromStateObject: ( stateObject: string ) => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumuerationIO value type, expected string' );
        assert && assert( keys.indexOf( stateObject ) >= 0, `Unrecognized value: ${stateObject}` );

        // @ts-ignore
        return enumeration[ stateObject ];
      },
      stateSchema: StateSchema.asValue( `${keys.join( '|' )}`, {
        isValidValue: ( v: string ) => keys.includes( v )
      } )
    } ) );
  }

  return cache.get( enumeration );
};

class RichEnumerationProperty<T> extends Property<T> {
  constructor( EnumerationType: any, value: T, providedOptions?: any ) {
    providedOptions = providedOptions || {};
    const validValues = [];
    const keys = [];
    for ( const property in EnumerationType ) {
      if ( EnumerationType[ property ] instanceof EnumerationType ) {
        validValues.push( EnumerationType[ property ] );
        keys.push( property );
      }
    }
    providedOptions.phetioType = Property.PropertyIO( RichEnumuerationIO<T>( EnumerationType, keys, validValues ) );
    super( value, providedOptions );
  }
}

export default RichEnumerationProperty;