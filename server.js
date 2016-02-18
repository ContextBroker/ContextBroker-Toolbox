#!/usr/bin/env node

var Toolbox = require('./index')


var argv = process.argv

var config = argv[2]
if(!config)
{
  console.error('Usage:',args[1],'<config>')
  process.exit(1)
}

Toolbox(config).on('error', console.trace.bind(console))
