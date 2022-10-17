// Copyright 2022, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import dotRandom from '../../dot/js/dotRandom.js';
import VarianceNumberProperty from './VarianceNumberProperty.js';

QUnit.module( 'VarianceNumberProperty' );

QUnit.test( 'Test VarianceNumberProperty', assert => {

  const computeFunction = ( v: number ) => v + 1;

  const property = new VarianceNumberProperty( 0, computeFunction );

  assert.ok( property.getRandomizedValue() === 1, 'initial value' );
  // assert.ok( v.value === 1, 'value getter' );

  const mean = 6;
  const standardDeviation = 2;
  const computeFunction2 = ( mean: number ): number => {
    let u = 0;
    let v = 0;
    while ( u === 0 ) {
      u = dotRandom.nextDouble();
    } //Converting [0,1) to (0,1)
    while ( v === 0 ) {
      v = dotRandom.nextDouble();
    }
    return (
      mean +
      standardDeviation *
      Math.sqrt( -2.0 * Math.log( u ) ) *
      Math.cos( 2.0 * Math.PI * v )
    );
  };

  const secondProperty = new VarianceNumberProperty( mean, computeFunction2 );

  assert.ok( secondProperty.getRandomizedValue() !== secondProperty.getRandomizedValue(), 'randomly assigned' ); // eslint-disable-line no-self-compare

  // See the standard deviation in action!
  console.log( 'Variance number property tests:' );
  console.log( 'Mean: ' + mean );
  console.log( 'Standard deviation: ' + standardDeviation );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
  console.log( secondProperty.getRandomizedValue() );
} );
