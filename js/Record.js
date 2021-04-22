// Copyright 2021, University of Colorado Boulder

/**
 * Provides a store of values, where default values won't take up memory or have construction costs.
 * See https://github.com/phetsims/scenery/issues/1196
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import RecordProperty from './RecordProperty.js';
import axon from './axon.js';

const POSSIBLE_FIELDS = [
  'defaultValue',
  'onBefore',
  'onAfter',
  'equality',
  'validate',
  'create'
];

class Record {
  /**
   * @param {RecordConfig} config
   * @param {*} target
   */
  constructor( config, target ) {
    if ( assert ) {
      assert( config );

      Object.keys( config ).forEach( propertyName => {
        assert( !( propertyName.startsWith( '_' ) && propertyName.endsWith( '_' ) ),
          `${propertyName} should not start and end with underscores, those are reserved for Record internal use` );

        assert( config[ propertyName ].hasOwnProperty( 'defaultValue' ),
          `config for ${propertyName} has to have defaultValue` );

        Object.keys( config[ propertyName ] ).forEach( key => {
          assert( POSSIBLE_FIELDS.includes( key ),
            `config for ${propertyName} has unknown key ${key}, should be one of ${POSSIBLE_FIELDS}` );
        } );
      } );
    }

    // @private {RecordConfig}
    this._config_ = config;

    // @private {*}
    this._target_ = target;

    // @private {Object.<string,RecordProperty.<*>>}
    this._properties_ = {};
  }

  /**
   * Returns the value (from a shared copy if there have been no changes from the default).
   * @public
   *
   * @param {string} propertyName
   * @returns {*}
   */
  _get_( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      return this[ propertyName ];
    }
    else {
      return this._config_[ propertyName ].defaultValue;
    }
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @param {*} value
   */
  _set_( propertyName, value ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    const propertyConfig = this._config_[ propertyName ];

    const onBefore = propertyConfig.onBefore;
    const equality = propertyConfig.equality;

    if ( assert ) {
      const validate = propertyConfig.validate;

      validate && validate.call( this._target_, value );
    }

    if ( onBefore ) {
      value = onBefore.call( this._target_, value );
    }

    const oldValue = this._get_( propertyName );

    const changed = equality ? !equality.call( this._target_, value, oldValue ) : value !== oldValue;

    if ( changed ) {
      this[ propertyName ] = value;

      const onAfter = propertyConfig.onAfter;
      const property = this._properties_[ propertyName ];

      if ( onAfter ) {
        onAfter.call( this._target_, value, oldValue );
      }

      if ( property ) {
        property.notifyListeners( value, oldValue );
      }
    }
  }

  /**
   * Returns the value (creating an individual copy if it doesn't exist)
   * @public
   *
   * @param {string} propertyName
   * @returns {*}
   */
  _get_mutable_( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      return this[ propertyName ];
    }
    else {
      return ( this[ propertyName ] = this._config_[ propertyName ].create() );
    }
  }

  /**
   * Returns the value (from a MAPPED shared copy if there have been no changes from the default).
   * @public
   *
   * NOTE: This runs the default value through the onBefore handler, to remap the value when needed.
   *
   * @param {string} propertyName
   * @returns {*}
   */
  _get_with_default_mapped( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      return this[ propertyName ];
    }
    else {
      const propertyConfig = this._config_[ propertyName ];

      return propertyConfig.onBefore( propertyConfig.defaultValue );
    }
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @returns {boolean}
   */
  _has_( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    return this.hasOwnProperty( propertyName );
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @param {function} callback
   * @param {*} defaultResult
   * @returns {*}
   */
  _call_( propertyName, callback, defaultResult ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      return callback( this[ propertyName ] );
    }
    else {
      return defaultResult;
    }
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @returns {number}
   */
  _getLength_( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      return this[ propertyName ].length;
    }
    else {
      return 0;
    }
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @param {function} callback
   */
  _forEach_( propertyName, callback ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    if ( this.hasOwnProperty( propertyName ) ) {
      this[ propertyName ].forEach( callback );
    }
  }

  /**
   * @public
   *
   * @param {string} propertyName
   * @returns {*}
   */
  _getProperty_( propertyName ) {
    assert && assert( typeof propertyName === 'string' && this._config_[ propertyName ],
      `propertyName ${propertyName} not found in Record` );

    const property = this._properties_[ propertyName ];
    if ( property ) {
      return property;
    }

    // Force default value
    this._get_( propertyName );

    return ( this._properties_[ propertyName ] = new RecordProperty( this, propertyName ) );
  }

  /**
   * @public
   */
  _dispose_() {
    // Dispose all of the RecordProperties
    Object.keys( this._properties_ ).forEach( propertyName => {
      this._properties_[ propertyName ].dispose();
    } );
  }

  /**
   * @public
   *
   * @param {Array.<Object>} objs
   * @returns {Object}
   */
  static combineConfigs( ...objs ) {
    const config = {};

    objs.forEach( obj => {
      Object.keys( obj ).forEach( propertyName => {
        config[ propertyName ] = _.extend( config[ propertyName ], obj[ propertyName ] );
      } );
    } );

    return config;
  }

  /**
   * @public
   *
   * @param {Object} defaults
   * @returns {Object}
   */
  static configFromDefaults( defaults ) {
    const config = {};

    Object.keys( defaults ).forEach( propertyName => {
      config[ propertyName ] = {
        defaultValue: defaults[ propertyName ]
      };
    } );

    return config;
  }
}

axon.register( 'Record', Record );
export default Record;