'use strict'

const express = require('express')
var bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/api/hello', (req, res) => {
  console.log('request body: ' + req.body)
  // res.send({ express: 'Hello From Express' })
  if (req.body) {
    const query = [ req.body.text ]
    detectTextIntent('chatbot-poc-204117', require('uuid/v1')(), query, 'en-US')
      .then(responses => {
        console.log('after detect intent: ' + responses)
        logQueryResult(null, responses)
        res.send(responses)
      })
  }
})

app.listen(port, () => console.log(`Listening on port ${port}`))

const structjson = require('./structjson.js')

function detectTextIntent (projectId, sessionId, queries, languageCode) {
  // [START dialogflow_detect_intent_text]
  // Imports the Dialogflow library

  const dialogflow = require('dialogflow')

  // Instantiates a sessison client
  const sessionClient = new dialogflow.SessionsClient()

  if (!queries || !queries.length) {
    return
  }

  // The path to identify the agent that owns the created intent.
  const sessionPath = sessionClient.sessionPath(projectId, sessionId)

  let promise

  // Detects the intent of the queries.
  for (const query of queries) {
    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: languageCode
        }
      }
    }

    if (!promise) {
      // First query.
      console.log(`Sending query "${query}"`)
      promise = sessionClient.detectIntent(request)
    } else {
      promise = promise.then(responses => {
        console.log('Detected intent 1')
        const response = responses[0]
        logQueryResult(sessionClient, response.queryResult)

        // Use output contexts as input contexts for the next query.
        response.queryResult.outputContexts.forEach(context => {
          // There is a bug in gRPC that the returned google.protobuf.Struct
          // value contains fields with value of null, which causes error
          // when encoding it back. Converting to JSON and back to proto
          // removes those values.
          context.parameters = structjson.jsonToStructProto(
            structjson.structProtoToJson(context.parameters)
          )
        })
        request.queryParams = {
          contexts: response.queryResult.outputContexts
        }

        console.log(`Sending query "${query}"`)
        return sessionClient.detectIntent(request)
      })
    }
  }

  return promise
    .then(responses => {
      console.log('Detected intent 2')
      logQueryResult(sessionClient, responses[0].queryResult)
      return responses[0].queryResult
    })
    .catch(err => {
      console.error('ERROR:', err)
    })

  // [END dialogflow_detect_intent_text]
}

function logQueryResult (sessionClient, result) {
  // Imports the Dialogflow library
  const dialogflow = require('dialogflow')

  // Instantiates a context client
  const contextClient = new dialogflow.ContextsClient()

  console.log(`  Query: ${result.queryText}`)
  console.log(`  Response: ${result.fulfillmentText}`)
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`)
  } else {
    console.log(`  No intent matched.`)
  }
  const parameters = JSON.stringify(
    structjson.structProtoToJson(result.parameters)
  )
  console.log(`  Parameters: ${parameters}`)
  if (result.outputContexts && result.outputContexts.length) {
    console.log(`  Output contexts:`)
    result.outputContexts.forEach(context => {
      const contextId = contextClient.matchContextFromContextName(context.name)
      const contextParameters = JSON.stringify(
        structjson.structProtoToJson(context.parameters)
      )
      console.log(`    ${contextId}`)
      console.log(`      lifespan: ${context.lifespanCount}`)
      console.log(`      parameters: ${contextParameters}`)
    })
  }
}

// const cli = require(`yargs`)
//   .demand(1)
//   .options({
//     projectId: {
//       alias: 'p',
//       default: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
//       description:
//         'The Project ID to use. Defaults to the value of the ' +
//         'GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT environment variables.',
//       requiresArg: true,
//       type: 'string'
//     },
//     sessionId: {
//       alias: 's',
//       default: require('uuid/v1')(),
//       type: 'string',
//       requiresArg: true,
//       description:
//         'The identifier of the detect session. Defaults to a random UUID.'
//     },
//     languageCode: {
//       alias: 'l',
//       default: 'en-US',
//       type: 'string',
//       requiresArg: true,
//       description: 'The language code of the query. Defaults to "en-US".'
//     },
//     encoding: {
//       alias: 'e',
//       default: 'AUDIO_ENCODING_LINEAR16',
//       choices: [
//         'AUDIO_ENCODING_LINEAR16',
//         'AUDIO_ENCODING_FLAC',
//         'AUDIO_ENCODING_MULAW',
//         'AUDIO_ENCODING_AMR',
//         'AUDIO_ENCODING_AMR_WB',
//         'AUDIO_ENCODING_OGG_OPUS',
//         'AUDIO_ENCODING_SPEEX_WITH_HEADER_BYTE'
//       ],
//       requiresArg: true,
//       description: 'The encoding of the input audio.'
//     },
//     sampleRateHertz: {
//       alias: 'r',
//       type: 'number',
//       description:
//         'The sample rate in Hz of the input audio. Only ' +
//         'required if the input audio is in raw format.'
//     }
//   })
//   .demandOption(
//     'projectId',
//     "Please provide your Dialogflow agent's project ID with the -p flag or through the GOOGLE_CLOUD_PROJECT env var"
//   )
//   .command(
//     `text`,
//     `Detects the intent for text queries.`,
//   {
//     queries: {
//       alias: 'q',
//       array: true,
//       string: true,
//       demandOption: true,
//       requiresArg: true,
//       description: 'An array of text queries'
//     }
//   },
//     opts =>
//       detectTextIntent(
//         opts.projectId,
//         opts.sessionId,
//         opts.queries,
//         opts.languageCode
//       )
//   )
//   .example(
//     `node $0 text -q "hello" "book a room" "Mountain View" ` +
//       `"today" "230pm" "half an hour" "two people" "A" "yes"`
//   )
//   .example(`node $0 event order_pizza`)
//   .example(`node $0 audio resources/book_a_room.wav -r 16000`)
//   .example(`node $0 stream resources/mountain_view.wav -r 16000`)
//   .wrap(120)
//   .recommendCommands()
//   .epilogue(
//     `For more information, see https://cloud.google.com/conversation/docs`
//   )
//   .help()
//   .strict()

// if (module === require.main) {
//   cli.parse(process.argv.slice(2))
// }
