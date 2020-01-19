// Copyright 2013-2019, University of Colorado Boulder

// load modules so they will attach to the namespace
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' ); // eslint-disable-line
  const BooleanProperty = require( 'AXON/BooleanProperty' ); // eslint-disable-line
  const DerivedProperty = require( 'AXON/DerivedProperty' ); // eslint-disable-line
  const DynamicProperty = require( 'AXON/DynamicProperty' ); // eslint-disable-line
  const Emitter = require( 'AXON/Emitter' );// eslint-disable-line
  const Events = require( 'AXON/Events' );// eslint-disable-line
  const Multilink = require( 'AXON/Multilink' );// eslint-disable-line
  const ObservableArray = require( 'AXON/ObservableArray' );// eslint-disable-line
  const Property = require( 'AXON/Property' );// eslint-disable-line
  const StringProperty = require( 'AXON/StringProperty' );// eslint-disable-line
  const NumberProperty = require( 'AXON/NumberProperty' );// eslint-disable-line

  return axon;
} );