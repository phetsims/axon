// Copyright 2013-2019, University of Colorado Boulder

define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const DerivedProperty = require( 'AXON/DerivedProperty' );
  const DynamicProperty = require( 'AXON/DynamicProperty' );
  const Emitter = require( 'AXON/Emitter' );
  const Events = require( 'AXON/Events' );
  const Multilink = require( 'AXON/Multilink' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const Property = require( 'AXON/Property' );
  const StringProperty = require( 'AXON/StringProperty' );
  const NumberProperty = require( 'AXON/NumberProperty' );

  return axon;
} );