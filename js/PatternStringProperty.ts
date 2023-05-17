// Copyright 2022-2023, University of Colorado Boulder

/**
 * A DerivedProperty that applies a string pattern (like StringUtils.fillIn). It has options for mapping values,
 * either with decimalPlaces or an arbitrary function so that there is just one Property set up for disposal.
 *
 * PatternStringPropertyTests.ts has many examples that may be useful!
 *
 * Basic usage can involve values as Properties or directly as values (both work):
 *
 * | const patternStringProperty = new TinyProperty( '{{valueA}} + {{valueB}}' );
 * | const property = new PatternStringProperty( patternStringProperty, {
 * |   valueA: 5,
 * |   valueB: new TinyProperty( 7 )
 * | } );
 * | property.value; // '5 + 7'
 *
 * Did your string use StringUtils.format? formatNames can be used to be compatible:
 *
 * | const property = new PatternStringProperty( new TinyProperty( '{0} + {1}' ), {
 * |   valueA: 5,
 * |   valueB: new TinyProperty( 7 )
 * | }, {
 * |   formatNames: [ 'valueA', 'valueB' ]
 * | } );
 * | property.value; // '5 + 7'
 *
 * Want to apply unit conversions or other formulas? Use maps
 *
 * | const gramsProperty = new TinyProperty( 2000 );
 * | new PatternStringProperty( new TinyProperty( '{{kilograms}} kg' ), {
 * |   kilograms: gramsProperty
 * | }, {
 * |   maps: {
 * |     kilograms: ( grams: number ) => grams / 1000
 * |   }
 * | } );
 * | property.value; // '2 kg'
 *
 * Using a numeric value, and want to show a certain number of decimal places? Use decimalPlaces!
 *
 * | const gramsProperty = new TinyProperty( 2143 );
 * | new PatternStringProperty( new TinyProperty( '{{kilograms}} kg' ), {
 * |   kilograms: gramsProperty
 * | }, {
 * |   maps: {
 * |     kilograms: ( grams: number ) => grams / 1000
 * |   },
 * |   decimalPlaces: 2
 * | } );
 * | property.value; // '2.14 kg'
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import DerivedProperty, { DerivedPropertyOptions } from './DerivedProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import Utils from '../../dot/js/Utils.js';
import optionize from '../../phet-core/js/optionize.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import CollapsePropertyValue from '../../phet-core/js/types/CollapsePropertyValue.js';
import KeysMatching from '../../phet-core/js/types/KeysMatching.js';
import KeysNotMatching from '../../phet-core/js/types/KeysNotMatching.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import Tandem from '../../tandem/js/Tandem.js';

// The type of allowed values for a PatternStringProperty
type ValuesType = Record<string, IntentionalAny>;

// The types of values that we won't require maps for
type StringNumberOrProperty = string | number | TReadOnlyProperty<string> | TReadOnlyProperty<number> | TReadOnlyProperty<string | number>;

// We'll require maps for things that aren't string | number, or Property types with only those values
type MapsType<Values extends ValuesType> = {
  [Key in KeysMatching<Values, StringNumberOrProperty>]?: ( value: CollapsePropertyValue<Values[Key]> ) => string | number;
} & {
  [Key in KeysNotMatching<Values, StringNumberOrProperty>]: ( value: CollapsePropertyValue<Values[Key]> ) => string | number;
};

type OptionalSelfOptions<Values extends ValuesType> = {
  // For handling pattern strings from StringUtils.format, which will turn {0} => {{formatName[ 0 ]}},
  // {1} => {{formatName[ 1 ]}}, etc.
  //
  // For example:
  // | const stringProperty = new TinyProperty( 'Test: {0}' );
  // | const valueProperty = new TinyProperty( 5 );
  // | new PatternStringProperty( stringProperty, { value: valueProperty }, { formatNames: [ 'value' ] } );
  // Will effectively replace {0} in the pattern to {{value}}, which will then be used as normal
  formatNames?: string[];

  // Rounds numeric values to a given number of decimal places if provided. If a number is given, it will apply to
  // ALL numeric values (of type 'number'). A record can also be provided that provides decimalPlaces for specific
  // values.
  //
  // For example:
  // | const stringProperty = new TinyProperty( 'Test: {{value}}' );
  // | const valueProperty = new TinyProperty( 5.12345 );
  // | new PatternStringProperty( stringProperty, { value: valueProperty }, { decimalPlaces: 2 } )
  // will take the value 'Test: 5.12'.
  //
  // Multiple decimal places example:
  // | const stringProperty = new TinyProperty( 'There are {{squirrels}} million squirrels who eat more than {{acorns}} acorns a day' );
  // | const squirrelsProperty = new TinyProperty( 5.12345 );
  // | const acornsProperty = new TinyProperty( 20.254 );
  // | new PatternStringProperty( stringProperty, {
  // |   squirrels: squirrelsProperty,
  // |   acorns: acornsProperty
  // | }, {
  // |   decimalPlaces: {
  // |     squirrels: 0,
  // |     acorns: 2
  // |   }
  // | } )
  //
  // NOTE: Provide null if decimal places should not be used for a given value
  decimalPlaces?: number | null | Record<keyof Values, number | null>;
};

type SelfOptions<Values extends ValuesType> = OptionalSelfOptions<Values> &
  ( KeysNotMatching<Values, StringNumberOrProperty> extends never ? {
    // Maps the input string/numeric values (depending on the Property type) to a string or number. Decimal places will be
    // applied after this step (if it returns a number).
    //
    // For example:
    // | const stringProperty = new TinyProperty( '{{grams}} grams' );
    // | const kilogramsProperty = new TinyProperty( 5.12 );
    // | new PatternStringProperty( stringProperty, { preposition: kilogramsProperty }, {
    // |   maps: { preposition: kilograms => kilograms / 1000 }
    // | } );
    maps?: MapsType<Values>;
  } : {
      // Make this required if someone's passing in something that is of a non-string/number type
      maps: MapsType<Values>;
    } );

type SuperOptions = DerivedPropertyOptions<string>;
export type PatternStringPropertyOptions<Values extends ValuesType> = SelfOptions<Values> & SuperOptions;

// Shared here, since it will always be the same function
const stringify = ( value: string | number ): string => `${value}`;

export default class PatternStringProperty<Values extends ValuesType> extends DerivedProperty<string,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown> {
  public constructor( patternProperty: TReadOnlyProperty<string>, values: Values, providedOptions?: PatternStringPropertyOptions<Values> ) {

    assert && assert( !( values.tandem instanceof Tandem ), 'Did you intend to put tandem in providedOptions?' );

    const options = optionize<OptionalSelfOptions<Values> & { maps?: MapsType<Values> }, OptionalSelfOptions<Values>, SuperOptions>()( {
      formatNames: [],

      decimalPlaces: null,

      phetioValueType: StringIO
    }, providedOptions );

    const dependencies: TReadOnlyProperty<IntentionalAny>[] = [ patternProperty ];
    const maps: Record<keyof Values, ( value: IntentionalAny ) => string> = {} as IntentionalAny;

    const keys: ( keyof Values )[] = Object.keys( values );
    keys.forEach( key => {
      const value = values[ key ] as IntentionalAny; // This is the declared type anyway, TypeScript is needing the cast
      if ( value instanceof ReadOnlyProperty || value instanceof TinyProperty ) {
        dependencies.push( value );
      }

      let stringNumberMap: ( value: string | number ) => string = stringify;

      // If we are applying decimal places, "prepend" that map before the others
      if ( options.decimalPlaces !== null && ( typeof options.decimalPlaces === 'number' || options.decimalPlaces[ key ] !== null ) ) {
        // It won't be null (we checked above for hasDecimalPlaces), asserted below
        const decimalPlaces: number = ( typeof options.decimalPlaces === 'number' || options.decimalPlaces === null )
                                      ? options.decimalPlaces
                                      : options.decimalPlaces[ key ]!;
        assert && assert( decimalPlaces !== null );

        stringNumberMap = ( value: string | number ) => stringify( typeof value === 'number' ? Utils.toFixed( value, decimalPlaces ) : value );
      }

      // If we are applying a map, "prepend" that map before the others, so that if it returns a number, we can
      // apply decimal places to it.
      if ( options.maps && options.maps.hasOwnProperty( key ) ) {
        maps[ key ] = value => stringNumberMap( options.maps![ key ]( value ) );
      }
      else {
        maps[ key ] = stringNumberMap;
      }
    } );

    // @ts-expect-error We can't get our dependencies to dynamically type here fully
    super( dependencies, ( ...propertyValues: unknown[] ) => {

      const getValue = ( value: unknown ): unknown => {
        const index = dependencies.indexOf( value as IntentionalAny );

        // If it's a Property, it will be in our dependencies, and we'll look up the value from our DerivedProperty
        return index >= 0 ? propertyValues[ index ] : value;
      };

      let result = `${getValue( patternProperty )}`; // String cast (it won't be a number, due to TypeScript)

      // Handle StringUtils.format compatibility, turning {0} => formatName[ 0 ], {1} => formatName[ 1 ], etc.
      options.formatNames.forEach( ( formatName: string, index: number ) => {
        result = result.replace( new RegExp( `\\{${index}\\}`, 'g' ), `{{${formatName}}}` );
      } );

      // {string[]} parse out the set of placeholders
      const placeholders = result.match( /\{\{[^{}]+\}\}/g ) || [];

      // replace each placeholder with its corresponding value
      for ( let i = 0; i < placeholders.length; i++ ) {
        const placeholder = placeholders[ i ];

        // key is the portion of the placeholder between the curly braces
        const key = placeholder.replace( '{{', '' ).replace( '}}', '' );
        if ( keys.includes( key ) ) {
          let value = getValue( values[ key ] );
          if ( maps[ key ] ) {
            value = maps[ key ]( value );
          }
          result = result.replace( placeholder, `${value}` );
        }
      }

      return result;
    }, options );
  }
}

axon.register( 'PatternStringProperty', PatternStringProperty );
