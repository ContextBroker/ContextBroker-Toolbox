var extname      = require('path').extname
var EventEmitter = require('events')
var readFileSync = require('fs').readFileSync

var inherits = require('inherits')
var yaml     = require('js-yaml')

var ContextBroker = require('context-broker')


/**
 * Load the configuration from the defined path
 *
 * @param {string} path
 *
 * @return {Object}
 *
 * @throws {TypeError} Unknown file format
 */
function loadConfig(path)
{
  var ext = extname(path)
  switch(ext)
  {
    case '.json':
      return require(path)

    case '.yaml':
    case '.yml':
      var options = {schema: yaml.JSON_SCHEMA}
      return yaml.safeLoad(readFileSync(path, 'utf8'), options)
  }

  throw new TypeError('Unknown file format for "'+path+'"')
}

/**
 * Create, initialize and connect a connector to the Context Broker
 *
 * @param {string} name - module name of the connector
 * @param {Object} config - configuration of the connector instance
 */
function createConnector(contextBroker, name, config, onError)
{
  contextBroker.pipe(require(name)(config)).on('error', onError)
}


/**
 * Connect the Context Broker to several connectors
 *
 * @constructor
 *
 * @param {string|Object} config - config object or path to file containing it
 *
 * @emits {Toolbox#Error} error
 */
function Toolbox(config)
{
  if(!this instanceof Toolbox) return new Toolbox(config)

  Toolbox.super_.call(this)

  var onError = this.emit.bind(this, 'error')


  // Load config
  if(typeof config === 'string') config = loadConfig(config)

  // Create context broker
  var contextBroker = ContextBroker(config.contextBroker)
  .on('error', onError)


  //
  // Create connectors
  //

  var connectors = config.connectors

  // Array
  if(connectors instanceof Array)
    return connectors.forEach(function(connector)
    {
      createConnector(contextBroker, connector.type, connector, onError)
    })

  // Single object
  var type = connectors.type
  if(type)
    return createConnector(contextBroker, type, connectors, onError)

  // Mapping
  for(var key in connectors)
    createConnector(contextBroker, key, connectors[key], onError)
}
inherits(Toolbox, EventEmitter)


module.exports = Toolbox
