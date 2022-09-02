// Copyright 2022, University of Colorado Boulder

/**
 * PatternStringProperty tests
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyProperty from './TinyProperty.js';
import PatternStringProperty from './PatternStringProperty.js';

QUnit.module( 'PatternStringProperty' );

QUnit.test( 'Basic usage', assert => {
  const patternProperty = new TinyProperty( 'Value: {{value}}' );
  const valueProperty = new TinyProperty( 5 );
  const property = new PatternStringProperty( patternProperty, {
    value: valueProperty
  } );

  assert.equal( property.value, 'Value: 5' );

  patternProperty.value = 'Why {{value}}?';
  assert.equal( property.value, 'Why 5?' );

  valueProperty.value = 10;
  assert.equal( property.value, 'Why 10?' );
} );

QUnit.test( 'Constant usage', assert => {
  const patternProperty = new TinyProperty( 'Value: {{value}}' );
  const property = new PatternStringProperty( patternProperty, {
    value: 5
  } );

  assert.equal( property.value, 'Value: 5' );

  patternProperty.value = 'Why {{value}}?';
  assert.equal( property.value, 'Why 5?' );
} );

QUnit.test( 'Multiple Properties', assert => {
  const patternProperty = new TinyProperty( 'Is {{valueA}} greater than {{valueB}}?' );
  const valueAProperty = new TinyProperty( 4 );
  const valueBProperty = new TinyProperty( 6 );
  const property = new PatternStringProperty( patternProperty, {
    valueA: valueAProperty,
    valueB: valueBProperty
  } );

  assert.equal( property.value, 'Is 4 greater than 6?' );

  valueAProperty.value = 7;
  assert.equal( property.value, 'Is 7 greater than 6?' );

  valueBProperty.value = 10;
  assert.equal( property.value, 'Is 7 greater than 10?' );
} );

QUnit.test( 'Decimal Places (basic)', assert => {
  const patternProperty = new TinyProperty( 'Value: {{value}}' );
  const valueProperty = new TinyProperty( 4 );
  const property = new PatternStringProperty( patternProperty, {
    value: valueProperty
  }, {
    decimalPlaces: 2
  } );

  assert.equal( property.value, 'Value: 4.00' );

  valueProperty.value = Math.PI;
  assert.equal( property.value, 'Value: 3.14' );
} );

QUnit.test( 'Decimal Places (multiple)', assert => {
  const patternProperty = new TinyProperty( 'Is {{valueA}} greater than {{valueB}}?' );
  const valueAProperty = new TinyProperty( 4 );
  const valueBProperty = new TinyProperty( 6 );
  const property = new PatternStringProperty( patternProperty, {
    valueA: valueAProperty,
    valueB: valueBProperty
  }, {
    decimalPlaces: {
      valueA: 1,
      valueB: 2
    }
  } );

  assert.equal( property.value, 'Is 4.0 greater than 6.00?' );
} );

QUnit.test( 'Decimal Places (only one)', assert => {
  const patternProperty = new TinyProperty( 'Is {{valueA}} greater than {{valueB}}?' );
  const valueAProperty = new TinyProperty( 4 );
  const valueBProperty = new TinyProperty( 6 );
  const property = new PatternStringProperty( patternProperty, {
    valueA: valueAProperty,
    valueB: valueBProperty
  }, {
    decimalPlaces: {
      valueA: null,
      valueB: 2
    }
  } );

  assert.equal( property.value, 'Is 4 greater than 6.00?' );
} );

QUnit.test( 'Map (basic)', assert => {
  const patternProperty = new TinyProperty( 'Value: {{value}}' );
  const valueProperty = new TinyProperty( 4 );
  const property = new PatternStringProperty( patternProperty, {
    value: valueProperty
  }, {
    maps: {
      value: ( n: number ) => n * 2
    }
  } );

  assert.equal( property.value, 'Value: 8' );

  valueProperty.value = 1;
  assert.equal( property.value, 'Value: 2' );
} );

QUnit.test( 'Map (with decimal places)', assert => {
  const patternProperty = new TinyProperty( 'Value: {{value}}' );
  const valueProperty = new TinyProperty( 2 );
  const property = new PatternStringProperty( patternProperty, {
    value: valueProperty
  }, {
    maps: {
      value: ( n: number ) => n / 4
    },
    decimalPlaces: 2
  } );

  assert.equal( property.value, 'Value: 0.50' );

  valueProperty.value = 1;
  assert.equal( property.value, 'Value: 0.25' );
} );

QUnit.test( 'Map (string)', assert => {
  const patternProperty = new TinyProperty( 'What does the fox say: {{value}}' );
  const valueProperty = new TinyProperty( 'Hello' );
  const property = new PatternStringProperty( patternProperty, {
    value: valueProperty
  }, {
    maps: {
      value: ( str: string ) => `${str}!`
    }
  } );

  assert.equal( property.value, 'What does the fox say: Hello!' );
} );

QUnit.test( 'Map (non-value)', assert => {
  const patternProperty = new TinyProperty( 'Sum is {{sum}}' );
  const valueProperty = new TinyProperty( [ 1, 2, 3 ] );
  const property = new PatternStringProperty( patternProperty, {
    sum: valueProperty
  }, {
    maps: {
      sum: ( values: number[] ) => _.sum( values )
    }
  } );

  assert.equal( property.value, 'Sum is 6' );

  valueProperty.value = [ 4, 0, 9 ];
  assert.equal( property.value, 'Sum is 13' );
} );

QUnit.test( 'formatNames', assert => {
  const patternProperty = new TinyProperty( 'Values: {0} and {1}' );
  const property = new PatternStringProperty( patternProperty, {
    valueA: 5,
    valueB: 7
  }, {
    formatNames: [ 'valueA', 'valueB' ]
  } );

  assert.equal( property.value, 'Values: 5 and 7' );
} );
