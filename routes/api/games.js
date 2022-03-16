const {Router} = require('express');
const { getGames, getGameMoves } = require('../../controllers/api/games');
const { isAuthorized } = require('../../middlewares/user');

const router = Router()

router.get("/games/:userId", isAuthorized, getGames);

router.get("/games/:gameId/:userId", isAuthorized, getGameMoves);

module.exports = router;