
(function(){
  'use strict';
  
  module( 'Axon: JSHint' );
  
  unitTestLintFilesMatching( function( src ) {
    return src.indexOf( 'axon/js' ) !== -1;
  } );
})();
