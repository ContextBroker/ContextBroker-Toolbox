#!/usr/bin/env node

var Toolbox = require('./index')


var args = process.args

var config = args[2]
if(!config)
{
  console.error('Usage:',args[1],'<config>')
  process.exit(1)
}

Toolbox(config).on('error', console.trace.bind(console))
