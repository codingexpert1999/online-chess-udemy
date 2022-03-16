const jwt = require('jsonwebtoken')
const dotenv = require("dotenv")

dotenv.config()

const secret = process.env.JWT_SECRET || "";

exports.isAuthorized = (req, res, next) => {
    let userId = parseInt(req.params.userId);

    try {
        jwt.verify(req.cookies.token, secret, (err, userPayload) => {
            if(err) throw err;

            if(userPayload.id !== userId){
                return res.status(401).json({error: "User not authorized"});
            }

            req.user = userPayload;

            next();
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}