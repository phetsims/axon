// Copyright 2023-2025, University of Colorado Boulder

/**
 * DerivedStringProperty is typically used for strings that are derived from LocalizedStringProperty
 * (translatable strings, generated from the {{REPO}}-strings_en.json file via 'grunt modulify') and/or other instances
 * of DerivedStringProperty. Using this class ensures that code follows PhET-iO instrumentation standards,
 * and makes occurrences of this type of string Property easier to identify.
 *
 * Responsibilities include:
 *  - ensures that the derivation returns a string
 *  - adds proper PhET-iO metadata, with defaults that have been specified by PhET-iO design, which can be
 *    overridden where appropriate (e.g. phetioFeatured) and are not part of the public API where they should
 *    not be overridable (e.g. phetioValueType)
 *
 * Note that you can also use DerivedStringProperty for model/logic strings that are not translated. But you'll
 * need to consider whether you want to override the default of phetioFeatured: true, which was chosen as the default
 * for translated strings.
 *
 * See https://github.com/phetsims/phet-io/issues/1943
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize, { type EmptySelfOptions } from '../../phet-core/js/optionize.js';
import type StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import DerivedProperty, { type DerivedPropertyOptions } from './DerivedProperty.js';
import { type DependenciesType } from './Multilink.js';

type SelfOptions = EmptySelfOptions;

type SuperOptions<T extends string> = DerivedPropertyOptions<T>; // the derivation returns a string

export type DerivedStringPropertyOptions<T extends string> = SelfOptions &
  StrictOmit<SuperOptions<T>, 'phetioValueType'> & // DerivedStringProperty is responsible for this metadata
  SuperOptions<T>;

export default class DerivedStringProperty<T extends string, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>
  extends DerivedProperty<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15> {

  public constructor( dependencies: DependenciesType<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>,
                      derivation: ( ...params: [ T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15 ] ) => T,
                      providedOptions?: DerivedStringPropertyOptions<T> ) {

    const options = optionize<DerivedStringPropertyOptions<T>, SelfOptions, SuperOptions<T>>()( {
      phetioFeatured: true, // featured by default, see https://github.com/phetsims/phet-io/issues/1943
      phetioValueType: StringIO,
      tandemNameSuffix: 'StringProperty' // Change only with caution
    }, providedOptions );

    super( dependencies, derivation, options );
  }
}

axon.register( 'DerivedStringProperty', DerivedStringProperty );