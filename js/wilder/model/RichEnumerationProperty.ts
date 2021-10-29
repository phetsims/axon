// Copyright 2021, University of Colorado Boulder

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
const RichEnumuerationIO = <T>( enumeration: any ): IOType => {

  if ( !cache.has( enumeration ) ) {

    const keyToValueMap = new Map<string, T>();
    const valueToKeyMap = new Map<T, string>();

    for ( const key in enumeration ) {
      const value = enumeration[ key ];
      if ( value instanceof enumeration ) {
        keyToValueMap.set( key, value );
        valueToKeyMap.set( value, key );
      }
    }

    const keys = Array.from( keyToValueMap.keys() );
    const values = Array.from( keyToValueMap.values() );

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = 'docs';//enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    cache.set( enumeration, new IOType( `RichEnumuerationIO(${keys.join( '|' )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => valueToKeyMap.get( t ),
      fromStateObject: ( stateObject: string ) => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumuerationIO value type, expected string' );
        assert && assert( keys.indexOf( stateObject ) >= 0, `Unrecognized value: ${stateObject}` );
        return keyToValueMap.get( stateObject )!;
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
    providedOptions.validValues = _.values( EnumerationType ).filter( value => value instanceof EnumerationType );
    providedOptions.phetioType = Property.PropertyIO( RichEnumuerationIO<T>( EnumerationType ) );
    super( value, providedOptions );
  }
}

export default RichEnumerationProperty;