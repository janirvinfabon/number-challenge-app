'use strict'

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const client = DynamoDBDocumentClient.from(new DynamoDBClient())
const TABLE = process.env.TABLE_NAME

const MAX_SCORE_PER_STAGE = 300 // 100 points * 3x max multiplier
const TOTAL_STAGES = 20

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Credentials': false,
  },
  body: JSON.stringify(body),
})

module.exports.submit = async (event) => {
  const { playerName, deviceId, score, stage } = JSON.parse(event.body || '{}')

  if (!playerName || !deviceId || typeof score !== 'number' || typeof stage !== 'number') {
    return response(400, { error: 'Missing required fields' })
  }

  const sanitizedName = playerName.trim().slice(0, 20)
  if (!sanitizedName) return response(400, { error: 'Invalid player name' })

  if (stage < 1 || stage > TOTAL_STAGES) return response(400, { error: 'Invalid stage' })
  if (score < 0 || score > stage * MAX_SCORE_PER_STAGE) return response(400, { error: 'Invalid score' })

  await client.send(new PutCommand({
    TableName: TABLE,
    Item: {
      playerName: sanitizedName,
      deviceId,
      timestamp: new Date().toISOString(),
      score,
      stage,
      gameType: 'global',
    },
  }))

  return response(201, { message: 'Score submitted' })
}

module.exports.getTop = async (event) => {
  const limit = Math.min(parseInt(event.queryStringParameters?.limit || '10'), 50)

  const result = await client.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'score-index',
    KeyConditionExpression: 'gameType = :g',
    ExpressionAttributeValues: { ':g': 'global' },
    ScanIndexForward: false, // descending by score
    Limit: limit,
  }))

  return response(200, result.Items)
}
