// Copyright 2013-2015, University of Colorado Boulder

define( function( require ) {
  'use strict';

  var Namespace = require( 'PHET_CORE/Namespace' );

  // Object allocation tracking - Set here so we can use a global reference that gets stripped out by uglify.
  window.phetAllocation = require( 'PHET_CORE/phetAllocation' );

  return new Namespace( 'axon' );
} );
