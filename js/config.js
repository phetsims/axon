// Copyright 2013-2015, University of Colorado Boulder

require.config( {
  deps: [ 'main' ],

  paths: {
    AXON: '.',
    PHET_CORE: '../../phet-core/js'
  },

  // optional cache buster to make browser refresh load all included scripts, can be disabled with ?cacheBuster=false
  urlArgs: phet.chipper.getCacheBusterArgs()
} );