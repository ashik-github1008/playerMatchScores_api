const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//get playersList api
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`
  const playersArray = await db.all(getPlayersQuery)
  const convertdbObjToOutputObj = dbObj => {
    return {
      playerId: dbObj.player_id,
      playerName: dbObj.player_name,
    }
  }

  response.send(
    playersArray.map(eachPlayer => convertdbObjToOutputObj(eachPlayer)),
  )
})

//getSpecificPlayer Api
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details
  WHERE player_id = ${playerId};`
  const player = await db.get(getPlayerQuery)
  const modPlayer = {
    playerID: player.player_id,
    playerName: player.player_name,
  }
  response.send(modPlayer)
})

//update api
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updateQuery = `UPDATE player_details 
  SET player_name = "${playerName}"
  WHERE player_id = ${playerId};`
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

//get matchDetails api
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const matchDetailsQuery = `SELECT * FROM match_details
  WHERE match_id = ${matchId};`
  const matchDetails = await db.get(matchDetailsQuery)
  const modMatchDetails = {
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  }
  response.send(modMatchDetails)
})

//getAllMatches of player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchesQuery = `SELECT 
  player_match_score.match_id AS matchId,
  match_details.match AS match,
  match_details.year AS year
  FROM (match_details INNER JOIN player_match_score on match_details.match_id = player_match_score.match_id) AS T
  INNER JOIN player_details on player_details.player_id = T.player_id
  WHERE player_match_score.player_id = ${playerId};`
  const matchesArray = await db.all(getMatchesQuery)
  response.send(matchesArray)
})

//getplayerofSpecific
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersQuery = `SELECT
  player_details.player_id AS playerId,player_details.player_name AS playerName
  FROM player_details INNER JOIN player_match_score on player_details.player_id = player_match_score.player_id
  WHERE player_match_score.match_id = ${matchId};`
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray)
})

//getStatisticsPlayer
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatisticsQuery = `SELECT
  player_match_score.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_details INNER JOIN player_match_score on player_details.player_id = player_match_score.player_id
  WHERE player_match_score.player_id = ${playerId};`
  const statistics = await db.get(getStatisticsQuery)
  response.send(statistics)
})

module.exports = app
