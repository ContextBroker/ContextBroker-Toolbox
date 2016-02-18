var assert = require('assert')

var decode = require('partly').Multipart.decode
var nock   = require('nock')

var Toolbox = require('./index')

nock.disableNetConnect()


const FIWARE_SERVICE = 'MyService'

const TOKEN   = 'token'
const CHAT_ID = 'chat_id'


var contextBroker = nock('http://example.com')
var telegram      = nock('https://api.telegram.org')


it('connect blocks', function(done)
{
  var expected =
  {
    attributes:
    [
      {
        name: 'temperature',
        type: 'centigrade',
        value: 23
      },
      {
        name: 'pressure',
        type: 'mmHg',
        value: 720
      }
    ],
    id: 'Room1',
    type: 'Room'
  }


  //
  // Configure fake servers
  //

  contextBroker.persist().post('/NGSI10/queryContext').reply(200,
  {
    contextResponses:
    [{
      contextElement: expected,
      statusCode:
      {
        code: 200,
        reasonPhrase: 'OK'
      }
    }]
  })

  telegram.post('/bot'+TOKEN+'/sendMessage')
  .reply(200, function(uri, requestBody)
  {
    var boundary = this.req.headers['content-type'].split('=')[1]

    var actual = JSON.parse(decode(requestBody, boundary)[1].Body)

    assert.deepEqual(actual, expected)

    done()
    toolbox.close()

    return {}
  })


  //
  // Exec test
  //

  var config =
  {
    contextBroker:
    {
      fiwareService: FIWARE_SERVICE,
      entities:
      {
        type: 'Room',
        id: 'Room1'
      }
    },
    connectors:
    {
      type: 'telegram-bot-log-stream',
      token: TOKEN,
      chat_id: CHAT_ID
    }
  }

  var toolbox = Toolbox(config).on('error', done)
})
