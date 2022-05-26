// Copyright 2021-2022, University of Colorado Boulder

/**
 * Base class that defines a settable Property that determines whether the Object is enabled or not. This includes
 * support for phet-io instrumentation and a variety of options to customize the enabled Property as well as how it is
 * created.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import EnabledProperty, { EnabledPropertyOptions } from './EnabledProperty.js';
import merge from '../../phet-core/js/merge.js';
import { optionize3 } from '../../phet-core/js/optionize.js';
import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import IProperty from './IProperty.js';

// constants
const DEFAULT_OPTIONS = {
  enabledProperty: null,
  enabled: true,
  enabledPropertyOptions: null,
  phetioEnabledPropertyInstrumented: true,
  tandem: Tandem.OPTIONAL
} as const;

export type EnabledComponentOptions = {
  // if not provided, a Property will be created
  enabledProperty?: IProperty<boolean> | null;

  // initial value of enabledProperty if we create it, ignored if enabledProperty is provided
  enabled?: boolean;

  // options to enabledProperty if we create it, ignored if enabledProperty is provided
  enabledPropertyOptions?: EnabledPropertyOptions | null;

  // Whether or not the default-created enabledProperty should be instrumented for PhET-iO. Ignored if
  // options.enabledProperty is provided.
  phetioEnabledPropertyInstrumented?: boolean;

  // phet-io
  tandem?: Tandem;
};

export default class EnabledComponent {

  enabledProperty: IProperty<boolean>;

  private disposeEnabledComponent: () => void;

  constructor( providedOptions?: EnabledComponentOptions ) {

    const options = optionize3<EnabledComponentOptions, EnabledComponentOptions>()( {}, DEFAULT_OPTIONS, providedOptions );

    const ownsEnabledProperty = !options.enabledProperty;

    assert && options.enabledPropertyOptions && assert( !( !options.phetioEnabledPropertyInstrumented && options.enabledPropertyOptions.tandem ),
      'incompatible options. Cannot specify phetioEnabledPropertyInstrumented opt out and a Tandem via enabledPropertyOptions.' );

    this.enabledProperty = options.enabledProperty || new EnabledProperty( options.enabled, merge( {
      tandem: options.phetioEnabledPropertyInstrumented ? options.tandem.createTandem( EnabledProperty.TANDEM_NAME ) : Tandem.OPT_OUT
    }, options.enabledPropertyOptions ) );

    this.disposeEnabledComponent = () => {
      ownsEnabledProperty && this.enabledProperty.dispose();
    };
  }

  setEnabled( enabled: boolean ): void { this.enabledProperty.value = enabled; }

  set enabled( value: boolean ) { this.setEnabled( value ); }

  get enabled(): boolean { return this.isEnabled(); }


  isEnabled(): boolean { return this.enabledProperty.value; }


  dispose(): void {
    this.disposeEnabledComponent();
  }
}

axon.register( 'EnabledComponent', EnabledComponent );
