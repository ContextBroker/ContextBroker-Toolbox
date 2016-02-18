var EventEmitter = require('events')
var path         = require('path')
var readFileSync = require('fs').readFileSync

var forceObjectsArray = require('force-objects-array')
var inherits          = require('inherits')
var yaml              = require('js-yaml')

var ContextBroker = require('context-broker')


/**
 * Load the configuration from the defined filepath
 *
 * @param {string} filepath
 *
 * @return {Object}
 *
 * @throws {TypeError} Unknown file format
 */
function loadConfig(filepath)
{
  var ext = path.extname(filepath)
  switch(ext)
  {
    case '.json':
      return require(path.resolve(__dirname, filepath))

    case '.yaml':
    case '.yml':
      var options = {schema: yaml.JSON_SCHEMA}
      return yaml.safeLoad(readFileSync(filepath, 'utf8'), options)
  }

  throw new TypeError('Unknown file format for "'+filepath+'"')
}

/**
 * Create, initialize and connect a connector to the Context Broker
 *
 * @param {Object} config - configuration of the connector instance
 */
function createConnector(config)
{
  this.pipe(require(config.type)(config))
  .on('error', this.emit.bind(this, 'error'))
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
  if(!(this instanceof Toolbox)) return new Toolbox(config)

  Toolbox.super_.call(this)

  // Load config
  if(typeof config === 'string') config = loadConfig(config)

  // Create context broker
  var contextBroker = ContextBroker(config.contextBroker)
  .on('error', this.emit.bind(this, 'error'))

  // Create connectors
  forceObjectsArray(config.connectors).forEach(createConnector, contextBroker)


  //
  // Public API
  //

  this.close = contextBroker.close.bind(contextBroker)
}
inherits(Toolbox, EventEmitter)


module.exports = Toolbox
