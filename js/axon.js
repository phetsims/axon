// Copyright 2002-2013, University of Colorado Boulder

define( function( require ) {
  'use strict';

  var axon = {};

  // workaround for Axon, since it needs window.arch to be defined
  window.arch = window.arch || null;

  // store a reference on the PhET namespace if it exists
  if ( window.phet ) {
    window.phet.axon = axon;
  }

  // will be filled in by other modules
  return axon;
} );
