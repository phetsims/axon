// Copyright 2021, University of Colorado Boulder

/**
 * Property support for rich enumeration types. Please see Orientation.ts for an example. This implementation
 * auto-detects the enumeration values by Object.keys and instanceof.  Every property that has a type matching
 * the enumeration type is marked as a value.
 *
 * class T{
 *     static a=new T();
 *     static b =new T();
 *     constructor(){}
 *     getName(){return 'he';}
 *     get thing(){return 'text';}
 *     static get age(){return 77;}
 * }
 * Object.keys(T) => ['a', 'b']
 * Object.values(T) => [T, T]
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from '../../../../axon/js/Property.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import StateSchema from '../../../../tandem/js/types/StateSchema.js';

// Cannot model as Constructor = new (...args) because we want to have private constructors
type RichEnumeration = Function & { [ key: string ]: any };

class RichEnumerationProperty<T> extends Property<T> {
  constructor( Enumeration: RichEnumeration, value: T, providedOptions?: PropertyOptions<T> ) {
    providedOptions = providedOptions || {};
    providedOptions.validValues = Object.values( Enumeration ).filter( value => value instanceof Enumeration );
    providedOptions.phetioType = Property.PropertyIO( RichEnumerationIO<T>( Enumeration ) );
    super( value, providedOptions );
  }
}

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<RichEnumeration, IOType>();

const RichEnumerationIO = <T>( Enumeration: RichEnumeration ): IOType => {

  // This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
  if ( !cache.has( Enumeration ) ) {

    // This work is only done once per RichEnumeration
    const keyToValueMap = new Map<string, T>();
    const valueToKeyMap = new Map<T, string>();

    for ( const key in Enumeration ) {
      const value = Enumeration[ key ];
      if ( value instanceof Enumeration ) {
        keyToValueMap.set( key, value );
        valueToKeyMap.set( value, key );
      }
    }

    const keys = Array.from( keyToValueMap.keys() );
    const values = Array.from( keyToValueMap.values() );

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = 'docs';//enumeration.phetioDocumentation ? ` ${enumeration.phetioDocumentation}` : '';

    cache.set( Enumeration, new IOType( `RichEnumerationIO(${keys.join( '|' )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => valueToKeyMap.get( t ),
      fromStateObject: ( stateObject: string ): T => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumerationIO value type, expected string' );
        assert && assert( keys.includes( stateObject ), `Unrecognized value: ${stateObject}` );
        return keyToValueMap.get( stateObject )!;
      },
      stateSchema: StateSchema.asValue( `${keys.join( '|' )}`, {
        isValidValue: ( v: string ) => keys.includes( v )
      } )
    } ) );
  }

  return cache.get( Enumeration )!;
};

export default RichEnumerationProperty;