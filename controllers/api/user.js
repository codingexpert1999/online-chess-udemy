const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs")
const db = require("../../config/db");
const {validationResult} = require("express-validator");
const redisClient = require("../../config/redis");

const dotenv = require("dotenv")

dotenv.config()

const jwtSecret = process.env.JWT_SECRET || "secret";

exports.register = (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.redirect("/register?error=" + errors.array()[0].msg)
        }

        const {username, email, password, confirmPassword} = req.body;

        if(password !== confirmPassword){
            return res.redirect("/register?error=Passwords do not match!");
        }

        let query = `SELECT id FROM users WHERE username='${username}' OR email='${email}'`;

        db.query(query, async (err, result) => {
            if(err){
                throw err;
            }

            if(result.length > 0){
                return res.redirect("/register?error=Username or email is aleardy taken!");
            }

            const encryptedPassword = await bcrypt.hash(password, 10);

            query = `CALL createUser('${username}', '${email}', '${encryptedPassword}')`;

            db.query(query, (err) => {
                if(err){
                    throw err;
                }

                query = `SELECT id FROM users WHERE email='${email}'`;

                db.query(query, (err, result) => {
                    if(err){
                        throw err;
                    }

                    if(result.length === 0){
                        return res.redirect("/register?error=Something went wrong!");
                    }

                    let userId = result[0].id;

                    const payload = {
                        id: userId, username, email
                    };

                    jwt.sign(payload, jwtSecret, (err, token) => {
                        if(err){
                            throw err;
                        }

                        res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})
                        res.cookie("user_rank", 'beginner', {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})
                        res.cookie("user_points", 1000, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

                        res.redirect("/?success=You have register your user successfully");
                    })
                })
            })
        })
    } catch (err) {
        console.log(err)
        res.redirect("/register?error=Something went wrong!");
    }
}

exports.login = (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.redirect("/login?error=" + errors.array()[0].msg)
        }

        const {email, password} = req.body;

        let query = `SELECT * FROM users WHERE email='${email}'`;

        db.query(query, async (err, result) => {
            if(err){
                throw err;
            }

            if(result.length === 0){
                return res.redirect("/login?error=Email or password is incorrect!");
            }

            let user = result[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch){
                return res.redirect("/login?error=Email or password is incorrect!");
            }

            query = `SELECT user_rank, user_points FROM user_info WHERE user_id=${user.id}`;

            db.query(query, (err, result) => {
                if(err){
                    throw err;
                }

                let userInfo = result[0];

                const payload = {
                    id: user.id, username: user.username, email
                };

                jwt.sign(payload, jwtSecret, (err, token) => {
                    if(err){
                        throw err;
                    }

                    res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})
                    res.cookie("user_rank", userInfo.user_rank, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})
                    res.cookie("user_points", userInfo.user_points, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

                    res.redirect("/?success=You have logged in successfully");
                })
            })
        })
    } catch (err) {
        console.log(err);
        res.redirect("/login?error=Something went wrong!")
    }
}

exports.getInfo = (req, res) => {
    try {
        jwt.verify(req.cookies.token, jwtSecret, (err, userPayload) => {
            if(err) throw err;

            const {id, email, username} = userPayload

            let user = {
                id,
                username,
                email,
                user_rank: req.cookies.user_rank,
                user_points: req.cookies.user_points
            }

            return res.json(user);
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message});
    }
}

exports.changeUsername = (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {username} = req.body;

        let query = `SELECT id FROM users WHERE username='${username}'`;

        db.query(query, (err, result) => {
            if(err) throw err;

            if(result.length > 0){
                return res.status(400).json({error: "Username is already taken"})
            }

            query = `UPDATE users SET username='${username}' WHERE id=${req.user.id}`;

            db.query(query, (err) => {
                if(err) throw err;

                const payload = {
                    id: req.user.id,
                    username,
                    email: req.user.email
                }

                jwt.sign(payload, jwtSecret, (err, token) => {
                    if(err) throw err;

                    res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

                    res.json({message: "Your username updated successfully!", username});
                })
            })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.changeEmail = (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {email} = req.body;

        let query = `SELECT id FROM users WHERE email='${email}'`;

        db.query(query, (err, result) => {
            if(err) throw err;

            if(result.length > 0){
                return res.status(400).json({error: "Email is already taken"})
            }

            query = `UPDATE users SET email='${email}' WHERE id=${req.user.id}`;

            db.query(query, (err) => {
                if(err) throw err;

                const payload = {
                    id: req.user.id,
                    username: req.user.username,
                    email
                }

                jwt.sign(payload, jwtSecret, (err, token) => {
                    if(err) throw err;

                    res.cookie("token", token, {maxAge: 1000 * 60 * 60 * 24 * 30 * 6, httpOnly: true, secure: false, sameSite: "strict"})

                    res.json({message: "Your email updated successfully!", email});
                })
            })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.changePassword = (req, res) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()[0].msg})
        }

        const {oldPassword, newPassword} = req.body;

        let query = `SELECT password FROM users WHERE id=${req.user.id}`;

        db.query(query, async (err, result) => {
            if(err) throw err;

            const isMatch = await bcrypt.compare(oldPassword, result[0].password);

            if(!isMatch){
                return res.status(401).json({error: "Your password is incorrect"})
            }

            const encryptedPassword = await bcrypt.hash(newPassword, 10)

            query = `UPDATE users SET password='${encryptedPassword}' WHERE id=${req.user.id}`;

            db.query(query, (err) => {
                if(err) throw err;

                res.json({message: "Your password updated successfully!"});
            })
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.clearCookie("user_points");
    res.clearCookie("user_rank");

    res.redirect("/login")
}

exports.deleteAccount = (req, res) => {
    try {
        let query = `DELETE FROM users WHERE id=${req.user.id}`

        db.query(query, (err) => {
            if(err) throw err;

            res.json({message: "Account deleted successfully"})
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({error: err.message})
    }
}