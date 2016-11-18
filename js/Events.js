// Copyright 2013-2016, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction.
 *
 * @deprecated - use Emitter.js instead
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var cleanArray = require( 'PHET_CORE/cleanArray' );

  /**
   * @constructor
   */
  function Events() {
    this._eventListeners = {}; // @private
    this._staticEventListeners = {}; // @private
  }

  axon.register( 'Events', Events );

  Events.prototype = {

    // @public
    dispose: function() {
    },

    /////////////////////////////////////////////
    // Below this point are the functions for event handling, basically orthogonal to property value change notifications

    /**
     * Register a listener when the specified eventName is triggered. Use off() to remove.
     * Concurrent modification of listeners (on/off) from within the callback is acceptable.
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @public
     */
    on: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      this._eventListeners[ eventName ] = this._eventListeners[ eventName ] || [];
      this._eventListeners[ eventName ].push( callback );
    },

    /**
     * Register a listener when the specified eventName is triggered. Listener should be "static", meaning:
     *   1. It shall not add/remove any "static" listeners (including itself) while it is being called (as any type of side-effect), and
     *   2. "static" listeners should not be added while a non-static listener (on the same object) is being called.
     * These restrictions allow us to guarantee that all listeners attached when an event is triggered are called.
     * Since static listeners are stored separately, use offStatic() to remove listeners added with onStatic()
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @public
     */
    onStatic: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      this._staticEventListeners[ eventName ] = this._staticEventListeners[ eventName ] || [];
      this._staticEventListeners[ eventName ].push( callback );
    },

    /**
     * Adds a function which will only be called back once, after which it is removed as a listener.
     * If you need to remove a function added with 'once' you will have to remove its handle, which is returned by the function.
     * @param {string} eventName the name for the event channel
     * @param {function} callback function to be called back once (if at all)
     * @public
     */
    once: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      var self = this;
      var wrappedCallback = function() {
        self.off( eventName, wrappedCallback );

        //If no arguments being passed through, call back without processing arguments, for possible speed
        if ( arguments.length === 0 ) {
          callback();
        }
        else {

          //General case of passing events through to the wrapped callback function
          callback.apply( this, Array.prototype.slice.call( arguments, 0 ) );
        }
      };
      this.on( eventName, wrappedCallback );

      //Return the handle in case it needs to be removed.
      return wrappedCallback;
    },

    /**
     * Remove a listener added with on() from the specified event type.  Does nothing if the listener did not exist.
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @public
     */
    off: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      var index = -1;
      if ( this._eventListeners[ eventName ] ) {
        index = this._eventListeners[ eventName ].indexOf( callback );
        if ( index !== -1 ) {
          this._eventListeners[ eventName ].splice( index, 1 );
        }
      }

      return index; // so we can tell if we actually removed a listener
    },

    /**
     * Remove a listener added with onStatic() from the specified event type.  Does nothing if the listener did not exist.
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @public
     */
    offStatic: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      var index = -1;
      if ( this._staticEventListeners[ eventName ] ) {
        index = this._staticEventListeners[ eventName ].indexOf( callback );
        if ( index !== -1 ) {
          this._staticEventListeners[ eventName ].splice( index, 1 );
        }
      }

      return index; // so we can tell if we actually removed a listener
    },

    /**
     * Checks for the existence of a specific listener, attached to a specific event name. Doesn't check for static listeners
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @returns {boolean}
     * @public
     */
    hasListener: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      var array = this._eventListeners[ eventName ];
      return !!array && array.indexOf( callback ) >= 0;
    },

    /**
     * Checks for the existence of a specific static listener, attached to a specific event name. Doesn't check for non-static listeners
     * @param {string} eventName the name for the event channel
     * @param {function} callback
     * @returns {boolean}
     * @public
     */
    hasStaticListener: function( eventName, callback ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );
      assert && assert( typeof callback === 'function', 'callback should be a function' );

      var array = this._staticEventListeners[ eventName ];
      return !!array && array.indexOf( callback ) >= 0;
    },

    /**
     * Removes all listeners added with on() and onStatic().
     * @public
     */
    removeAllEventListeners: function() {
      var eventName;
      for ( eventName in this._eventListeners ) {
        cleanArray( this._eventListeners[ eventName ] );
      }
      for ( eventName in this._staticEventListeners ) {
        cleanArray( this._staticEventListeners[ eventName ] );
      }
    },

    /**
     * Trigger an event with the specified name and arguments.
     * @param {string} eventName the name for the event channel
     * @param args... optional arguments to pass to the listeners
     * @public
     */
    trigger: function( eventName ) {
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );

      var listeners = this._eventListeners[ eventName ];
      var staticListeners = this._staticEventListeners[ eventName ];

      // listener quantities for normal and static
      var count = listeners ? listeners.length : 0;
      var staticCount = staticListeners ? staticListeners.length : 0;

      // only compute our arguments suffix once, instead of in our inner loop
      var suffix;
      var hasNoArguments = arguments.length === 1;
      if ( !hasNoArguments && ( count > 0 || staticCount > 0 ) ) {
        phetAllocation && phetAllocation( 'Array' );
        suffix = Array.prototype.slice.call( arguments, 1 );
      }

      // make a copy of non-static listeners, in case callback removes listener
      if ( count > 0 ) {
        listeners = listeners.slice();
      }

      var i;

      for ( i = 0; i < count; i++ ) {
        var listener = listeners[ i ];

        //Simple case of no arguments, call it separately for improved performance in case it is faster (untested)
        if ( hasNoArguments ) {
          listener();
        }
        else {
          listener.apply( this, suffix );
        }

        assert && assert( !staticListeners || staticListeners.length === staticCount, 'Concurrent modifications of static listeners from within non-static listeners are forbidden' );
      }

      for ( i = 0; i < staticCount; i++ ) {
        var staticListener = staticListeners[ i ];

        //Simple case of no arguments, call it separately for improved performance in case it is faster (untested)
        if ( hasNoArguments ) {
          staticListener( arguments );
        }
        else {
          staticListener.apply( this, suffix );
        }

        assert && assert( staticListeners.length === staticCount, 'Concurrent modifications from static listeners are forbidden' );
      }
    },

    /**
     * Trigger an event with the specified name, with no arguments.  Since the number of arguments is known
     * no additional work is required to process and pass through the arguments (as opposed to trigger() itself).
     * @param {string} eventName the name for the event channel
     * @public
     */
    trigger0: function( eventName ) {
      assert && assert( arguments.length === 1 );
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );

      var listeners = this._eventListeners[ eventName ];
      var staticListeners = this._staticEventListeners[ eventName ];

      // listener quantities for normal and static
      var count = listeners ? listeners.length : 0;
      var staticCount = staticListeners ? staticListeners.length : 0;

      // make a copy of non-static listeners, in case callback removes listener
      if ( count > 0 ) {
        listeners = listeners.slice();
      }

      var i;

      for ( i = 0; i < count; i++ ) {
        listeners[ i ]();

        assert && assert( !staticListeners || staticListeners.length === staticCount, 'Concurrent modifications of static listeners from within non-static listeners are forbidden' );
      }

      for ( i = 0; i < staticCount; i++ ) {
        staticListeners[ i ]();

        assert && assert( staticListeners.length === staticCount, 'Concurrent modifications from static listeners are forbidden' );
      }
    },

    /**
     * Trigger an event with the specified name, with a single argument.  Since the number of arguments is known
     * no additional work is required to process and pass through the arguments (as opposed to trigger() itself).
     * @param {string} eventName the name for the event channel
     * @param {Object} param1 - the argument to pass through to the listeners
     * @public
     */
    trigger1: function( eventName, param1 ) {
      assert && assert( arguments.length === 2 );
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );

      var listeners = this._eventListeners[ eventName ];
      var staticListeners = this._staticEventListeners[ eventName ];

      // listener quantities for normal and static
      var count = listeners ? listeners.length : 0;
      var staticCount = staticListeners ? staticListeners.length : 0;

      // make a copy of non-static listeners, in case callback removes listener
      if ( count > 0 ) {
        listeners = listeners.slice();
      }

      var i;

      for ( i = 0; i < count; i++ ) {
        listeners[ i ]( param1 );

        assert && assert( !staticListeners || staticListeners.length === staticCount, 'Concurrent modifications of static listeners from within non-static listeners are forbidden' );
      }

      for ( i = 0; i < staticCount; i++ ) {
        staticListeners[ i ]( param1 );

        assert && assert( staticListeners.length === staticCount, 'Concurrent modifications from static listeners are forbidden' );
      }
    },

    /**
     * Trigger an event with the specified name, with two arguments.  Since the number of arguments is known
     * no additional work is required to process and pass through the arguments (as opposed to trigger() itself).
     * @param {string} eventName the name for the event channel
     * @param {Object} param1 - the first parameter
     * @param {Object} param2 - the second parameter
     * @public
     */
    trigger2: function( eventName, param1, param2 ) {
      assert && assert( arguments.length === 3 );
      assert && assert( typeof eventName === 'string', 'eventName should be a string' );

      var listeners = this._eventListeners[ eventName ];
      var staticListeners = this._staticEventListeners[ eventName ];

      // listener quantities for normal and static
      var count = listeners ? listeners.length : 0;
      var staticCount = staticListeners ? staticListeners.length : 0;

      // make a copy of non-static listeners, in case callback removes listener
      if ( count > 0 ) {
        listeners = listeners.slice();
      }

      var i;

      for ( i = 0; i < count; i++ ) {
        listeners[ i ]( param1, param2 );

        assert && assert( !staticListeners || staticListeners.length === staticCount, 'Concurrent modifications of static listeners from within non-static listeners are forbidden' );
      }

      for ( i = 0; i < staticCount; i++ ) {
        staticListeners[ i ]( param1, param2 );

        assert && assert( staticListeners.length === staticCount, 'Concurrent modifications from static listeners are forbidden' );
      }
    }
  };

  return Events;
} );
