(function() {
  module( 'Axon: Events' );
  
  test( 'Basics', function() {
    var events = new axon.Events();
    
    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name
    
    var aCount = 0;
    function incrementA() { aCount++; }
    function addIncrementAOnce() { events.once( 'a', incrementA ); }
    
    events.on( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    equal( aCount, 2, 'on() works' );
    
    events.off( 'a', incrementA );
    events.trigger( 'a' );
    equal( aCount, 2, 'off() works' );
    
    /*---------------------------------------------------------------------------*
    * Concurrent modification for non-static
    *----------------------------------------------------------------------------*/
    
    // will add a listener for 'a' increment when 'a' is fired
    events.on( 'a', addIncrementAOnce );
    events.trigger( 'a' );
    events.off( 'a', addIncrementAOnce );
    equal( aCount, 2, 'Increment should not fire, it was added while other callback was fired' );
    
    events.trigger( 'a' );
    equal( aCount, 3, 'Now increment should fire, but will remove itself' );
    
    events.trigger( 'a' );
    equal( aCount, 3, 'Since increment was once(), it should not increment more' );
  } );
  
  test( 'Static Basics', function() {
    var events = new axon.Events();
    
    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name
    
    var aCount = 0;
    function incrementA() { aCount++; }
    function addIncrementAOnce() { events.once( 'a', incrementA ); }
    
    events.onStatic( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    equal( aCount, 2, 'onStatic() works' );
    
    events.offStatic( 'a', incrementA );
    events.trigger( 'a' );
    equal( aCount, 2, 'offStatic() works' );
  } );
  
})();
