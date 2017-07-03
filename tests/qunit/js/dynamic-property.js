// Copyright 2016, University of Colorado Boulder

(function() {
  'use strict';

  module( 'Axon: DynamicProperty' );

  test( 'Basics', function() {
    var aProperty = new axon.Property( 5 ); // eslint-disable-line no-undef
    var bProperty = new axon.Property( 2 ); // eslint-disable-line no-undef
    var propertyProperty = new axon.Property( aProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new axon.DynamicProperty( propertyProperty ); // eslint-disable-line no-undef

    equal( dynamicProperty.value, aProperty.value );

    propertyProperty.value = bProperty;
    equal( dynamicProperty.value, bProperty.value );

    bProperty.value = 7;
    equal( dynamicProperty.value, bProperty.value );

    aProperty.value = 10;
    propertyProperty.value = aProperty;
    equal( dynamicProperty.value, aProperty.value );
  } );

  test( 'Derive (string)', function() {
    var a = {
      property: new axon.Property( 5 ) // eslint-disable-line no-undef
    };
    var b = {
      property: new axon.Property( 2 ) // eslint-disable-line no-undef
    };
    var mainProperty = new axon.Property( a ); // eslint-disable-line no-undef
    var dynamicProperty = new axon.DynamicProperty( mainProperty, { // eslint-disable-line no-undef
      derive: 'property'
    } );

    equal( dynamicProperty.value, a.property.value );

    mainProperty.value = b;
    equal( dynamicProperty.value, b.property.value );

    b.property.value = 7;
    equal( dynamicProperty.value, b.property.value );

    a.property.value = 10;
    mainProperty.value = a;
    equal( dynamicProperty.value, a.property.value );
  } );

  test( 'Derive (function)', function() {
    var a = {
      property: new axon.Property( 5 ) // eslint-disable-line no-undef
    };
    var b = {
      property: new axon.Property( 2 ) // eslint-disable-line no-undef
    };
    var mainProperty = new axon.Property( a ); // eslint-disable-line no-undef
    var dynamicProperty = new axon.DynamicProperty( mainProperty, { // eslint-disable-line no-undef
      derive: function( ob ) {
        return ob.property;
      }
    } );

    equal( dynamicProperty.value, a.property.value );

    mainProperty.value = b;
    equal( dynamicProperty.value, b.property.value );

    b.property.value = 7;
    equal( dynamicProperty.value, b.property.value );

    a.property.value = 10;
    mainProperty.value = a;
    equal( dynamicProperty.value, a.property.value );
  } );

  test( 'Bidirectional', function() {
    var firstProperty = new axon.Property( 5 ); // eslint-disable-line no-undef
    var secondProperty = new axon.Property( 10 ); // eslint-disable-line no-undef
    var numberPropertyProperty = new axon.Property( firstProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new axon.DynamicProperty( numberPropertyProperty, { bidirectional: true } ); // eslint-disable-line no-undef

    dynamicProperty.value = 2; // allowed now that it is bidrectional, otherwise prohibited
    equal( firstProperty.value, 2 );

    numberPropertyProperty.value = secondProperty; // change which property is active
    equal( dynamicProperty.value, 10 );

    dynamicProperty.value = 0;
    equal( secondProperty.value, 0 );
    equal( firstProperty.value, 2 );
  } );

  test( 'Mapping (with bidirectional)', function() {
    var firstProperty = new axon.Property( 5 ); // eslint-disable-line no-undef
    var secondProperty = new axon.Property( 10 ); // eslint-disable-line no-undef
    var numberPropertyProperty = new axon.Property( firstProperty ); // eslint-disable-line no-undef
    var dynamicProperty = new axon.DynamicProperty( numberPropertyProperty, { // eslint-disable-line no-undef
      bidirectional: true,
      map: function( number ) {
        return '' + number;
      },
      inverseMap: function( string ) {
        return Number.parseFloat( string );
      }
    } );

    equal( typeof dynamicProperty.value, 'string' );
    equal( dynamicProperty.value, '5' );

    dynamicProperty.value = '2';
    equal( firstProperty.value, 2 );

    numberPropertyProperty.value = secondProperty; // change which property is active
    equal( dynamicProperty.value, '10' );

    dynamicProperty.value = '0';
    equal( secondProperty.value, 0 );
    equal( firstProperty.value, 2 );
  } );

})();
