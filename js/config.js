// Copyright 2002-2013, University of Colorado Boulder

require.config( {
  deps: [ 'main' ],

  paths: {
    underscore: '../contrib/lodash.min-1.0.0-rc.3',
    AXON: '.',
    PHET_CORE: '../../phet-core/js'
  },

  shim: {
    underscore: { exports: '_' }
  },

  // optional cache buster to make browser refresh load all included scripts, can be disabled with ?cacheBuster=false
  urlArgs: phet.phetcommon.getCacheBusterArgs()
} );