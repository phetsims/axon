// Copyright 2021, University of Colorado Boulder

/**
 * Property support for rich enumeration types.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from './Property.js';
import IOType from '../../tandem/js/types/IOType.js';
import StateSchema from '../../tandem/js/types/StateSchema.js';
import IRichEnumeration from '../../phet-core/js/IRichEnumeration.js';

class RichEnumerationProperty<T> extends Property<T> {

  /**
   * Expects the container to have a rich enumeration like: Orientation.enum
   */
  constructor( enumerationContainer: { enum: IRichEnumeration<T> }, value: T, providedOptions?: PropertyOptions<T> ) {
    providedOptions = providedOptions || {};
    providedOptions.validValues = enumerationContainer.enum.values;
    providedOptions.phetioType = Property.PropertyIO( RichEnumerationIO<T>( enumerationContainer.enum ) );
    super( value, providedOptions );
  }
}

// Cache each parameterized IOType so that it is only created once.
const cache = new Map<IRichEnumeration<any>, IOType>();

const RichEnumerationIO = <T>( enumeration: IRichEnumeration<T> ): IOType => {

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

export default RichEnumerationProperty;