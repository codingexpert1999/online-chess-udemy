const {Router} = require("express")
const { getRegisterPage, getLoginPage, getLobbyPage, getGamesPage, getRoomPage, getStatsPage, getPlayedGamesPage, getProfilePage } = require("../../controllers/views")

const router = Router()

router.get("/register", getRegisterPage)

router.get("/login", getLoginPage)

router.get("/", getLobbyPage)

router.get("/games", getGamesPage)

router.get("/room", getRoomPage)

router.get("/my-stats", getStatsPage)

router.get("/my-stats/played-games/:gameId", getPlayedGamesPage)

router.get("/profile", getProfilePage)

module.exports = router;