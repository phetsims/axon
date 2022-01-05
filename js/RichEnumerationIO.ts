// Copyright 2021, University of Colorado Boulder
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import IRichEnumeration, { RichEnumerationContainer } from '../../phet-core/js/IRichEnumeration.js';
import IOType from '../../tandem/js/types/IOType.js';
import StateSchema from '../../tandem/js/types/StateSchema.js';

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<IRichEnumeration<any>, IOType>();

const RichEnumerationIO = <T extends EnumerationValue>( enumerationContainer: RichEnumerationContainer<T> ): IOType => {
  const enumeration = enumerationContainer.enumeration;

  // This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
  if ( !cache.has( enumeration ) ) {

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    const keys = enumeration.keys;
    const values = enumeration.values;

    cache.set( enumeration, new IOType( `RichEnumerationIO(${keys.join( '|' )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => enumeration.getKey( t ),
      fromStateObject: ( stateObject: string ): T => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumerationIO value type, expected string' );
        assert && assert( keys.includes( stateObject ), `Unrecognized value: ${stateObject}` );
        return enumeration.getValue( stateObject )!;
      },
      stateSchema: StateSchema.asValue( `${keys.join( '|' )}`, {
        isValidValue: ( key: string ) => keys.includes( key )
      } )
    } ) );
  }

  return cache.get( enumeration )!;
};

export default RichEnumerationIO;