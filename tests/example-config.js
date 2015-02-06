
require.config( {
  deps: [ 'example-main' ],

  paths: {

    //Load dependencies from sibling directories
    AXON: '../../axon/js',
    BRAND: '../../brand/js',
    DOT: '../../dot/js',
    SCENERY: '../../scenery/js',
    SCENERY_PHET: '../../scenery-phet/js',
    KITE: '../../kite/js',
    PHET_CORE: '../../phet-core/js',
    PHETCOMMON: '../../phetcommon/js',
    SUN: '../../sun/js',
    JOIST: '../../joist/js',
    ENERGY_SKATE_PARK_BASICS: '.',

    //Load plugins
    image: '../../chipper/requirejs-plugins/image',
    audio: '../../chipper/requirejs-plugins/audio',
    string: '../../chipper/requirejs-plugins/string',

    text: '../../sherpa/text'
  },

  shim: {
    underscore: { exports: '_' }
  },

  // optional cache buster to make browser refresh load all included scripts, can be disabled with ?cacheBuster=false
  urlArgs: phet.phetcommon.getCacheBusterArgs()
} );