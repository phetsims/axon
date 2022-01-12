// Copyright 2021-2022, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import IRichEnumeration, { RichEnumerationContainer } from '../../phet-core/js/IRichEnumeration.js';
import IOType from '../../tandem/js/types/IOType.js';
import StateSchema from '../../tandem/js/types/StateSchema.js';
import axon from './axon.js';

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<IRichEnumeration<any>, IOType>();

const joinKeys = ( keys: string[] ) => keys.join( '|' );

const EnumerationIO = <T extends EnumerationValue>( enumerationContainer: RichEnumerationContainer<T> ): IOType => {
  const enumeration = enumerationContainer.enumeration;

  // This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
  if ( !cache.has( enumeration ) ) {

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    const keys = enumeration.keys;
    const values = enumeration.values;

    cache.set( enumeration, new IOType( `EnumerationIO(${joinKeys( keys )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => enumeration.getKey( t ),
      fromStateObject: ( stateObject: string ): T => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumerationIO value type, expected string' );
        assert && assert( keys.includes( stateObject ), `Unrecognized value: ${stateObject}` );
        return enumeration.getValue( stateObject )!;
      },
      stateSchema: StateSchema.asValue( `${joinKeys( keys )}`, {
        isValidValue: ( key: string ) => keys.includes( key )
      } )
    } ) );
  }

  return cache.get( enumeration )!;
};

axon.register( 'EnumerationIO', EnumerationIO );
export default EnumerationIO;