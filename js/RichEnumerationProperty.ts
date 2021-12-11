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
 * Note how keys only picks up 'a' and 'b'.  Therefore, we can use Object.keys to infer the RichEnumerationType values
 * rather than having to re-list them in values or equivalent.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import IOType from '../../tandem/js/types/IOType.js';
import StateSchema from '../../tandem/js/types/StateSchema.js';
import RichEnumeration from '../../phet-core/js/RichEnumeration.js';

type RichEnumerationType<T> = {
  rich: RichEnumeration<T>;
  phetioDocumentation?: string;
};

class RichEnumerationProperty<T> extends Property<T> {
  constructor( Enumeration: RichEnumerationType<T>, value: T, providedOptions?: PropertyOptions<T> ) {
    providedOptions = providedOptions || {};
    providedOptions.validValues = Enumeration.rich.values;
    providedOptions.phetioType = Property.PropertyIO( RichEnumerationIO<T>( Enumeration ) );
    super( value, providedOptions );
  }
}

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<RichEnumerationType<any>, IOType>();

const RichEnumerationIO = <T>( Enumeration: RichEnumerationType<T> ): IOType => {

  // This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
  if ( !cache.has( Enumeration ) ) {

    // Enumeration supports additional documentation, so the values can be described.
    const additionalDocs = Enumeration.phetioDocumentation ? ` ${Enumeration.phetioDocumentation}` : '';

    const keys = Enumeration.rich.keys;
    const values = Enumeration.rich.values;

    cache.set( Enumeration, new IOType( `RichEnumerationIO(${keys.join( '|' )})`, {
      validValues: values,
      documentation: `Possible values: ${keys.join( ', ' )}.${additionalDocs}`,
      toStateObject: ( t: T ) => Enumeration.rich.getKey( t ),
      fromStateObject: ( stateObject: string ): T => {
        assert && assert( typeof stateObject === 'string', 'unsupported RichEnumerationIO value type, expected string' );
        assert && assert( keys.includes( stateObject ), `Unrecognized value: ${stateObject}` );
        return Enumeration.rich.getValue( stateObject )!;
      },
      stateSchema: StateSchema.asValue( `${keys.join( '|' )}`, {
        isValidValue: ( key: string ) => keys.includes( key )
      } )
    } ) );
  }

  return cache.get( Enumeration )!;
};

export default RichEnumerationProperty;