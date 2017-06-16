// Copyright 2013-2016, University of Colorado Boulder

require.config( {
  deps: [ 'main' ],

  paths: {
    AXON: '.',

    PHET_CORE: '../../phet-core/js',
    ifphetio: '../../chipper/js/requirejs-plugins/ifphetio',
    TANDEM: '../../tandem/js',
    text: '../../sherpa/lib/text-2.0.12',
    REPOSITORY: '..'
  },

  // optional cache buster to make browser refresh load all included scripts, can be disabled with ?cacheBuster=false
  urlArgs: phet.chipper.getCacheBusterArgs()
} );