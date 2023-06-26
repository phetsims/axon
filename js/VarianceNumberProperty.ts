// Copyright 2022-2023, University of Colorado Boulder

/**
 * A Property in which the output can be variable depending on a provided function. Statistical variation is quite
 * helpful in PhET sims to convey "real world" settings.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import NumberProperty, { NumberPropertyOptions } from './NumberProperty.js';

type VarianceComputer = ( value: number ) => number;

type VarianceNumberPropertyOptions = NumberPropertyOptions;

export default class VarianceNumberProperty extends NumberProperty {

  public readonly computeVariance: VarianceComputer | null;

  public constructor( value: number, computeVariance: VarianceComputer, options?: VarianceNumberPropertyOptions ) {
    super( value, options );

    this.computeVariance = computeVariance;
  }

  public getRandomizedValue(): number {
    return this.computeVariance ? this.computeVariance( super.get() ) : this.get();
  }
}

axon.register( 'VarianceNumberProperty', VarianceNumberProperty );
