const db = require('../../config/db')
const redisClient = require("../../config/redis")

exports.getGames = (req, res) => {
    try {
        redisClient.get(`${req.user.id}-played-games`, (err, reply) => {
            if(err) throw err;

            if(reply){
                let playedGames = JSON.parse(reply)

                res.json(playedGames)
            }else{
                let query = `
                    SELECT id, timer, moves, user_id_light, user_id_black,
                    date_format(started_at, '%d/%m/%y %H:%i') as started_at,
                    date_format(completed_at, '%d/%m/%y %H:%i') as completed_at
                    FROM games WHERE user_id_light=${req.user.id} OR user_id_black=${req.user.id}
                `

                db.query(query, (err, result) => {
                    if(err) throw err;

                    redisClient.setex(`${req.user.id}-played-games`, 3600 * 24, JSON.stringify(result))

                    res.json(result);
                })
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.getGameMoves = (req, res) => {
    try {
        const gameId = req.params.gameId

        redisClient.get(`${req.user.id}-played-game-${gameId}-moves`, (err, reply) => {
            if(err) throw err;

            if(reply){
                let moves = JSON.parse(reply);

                res.json(moves)
            }else{
                let query = `SELECT moves FROM games WHERE id=${gameId}`;

                db.query(query, (err, result) => {
                    if(err) throw err;

                    if(result.length === 0){
                        return res.status(404).json({error: "Game not found"})
                    }

                    let moves = JSON.parse(result[0].moves);

                    redisClient.set(`${req.user.id}-played-game-${gameId}-moves`, result[0].moves);

                    res.json(moves);
                })
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}