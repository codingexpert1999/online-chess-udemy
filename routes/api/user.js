const {Router} = require("express");
const { check } = require("express-validator");
const { register, login, getInfo, deleteAccount, changeUsername, changeEmail, changePassword, logout } = require("../../controllers/api/user");
const {isAuthorized} = require("../../middlewares/user")

const router = Router();

router.post("/register", [
    check('username', "Username is required").notEmpty(),
    check('email', "Email is required").notEmpty(),
    check('email', "Please enter a valid email").isEmail(),
    check('password', "Password is required").notEmpty(),
    check('confirmPassword', "Please confirm your password").notEmpty(),
], register)

router.post("/login", [
    check('email', "Email is required").notEmpty(),
    check('email', "Please enter a valid email").isEmail(),
    check('password', "Password is required").notEmpty()
], login)

router.put("/user/username/:userId", isAuthorized, [
    check('username', "Username is required").notEmpty()
], changeUsername);

router.put("/user/email/:userId", isAuthorized, [
    check('email', "Email is required").notEmpty(),
    check('email', "Please enter a valid email").isEmail()
], changeEmail);

router.put("/user/password/:userId", isAuthorized, [
    check('oldPassword', "Old password is required").notEmpty(),
    check('newPassword', "New password is required").notEmpty()
], changePassword);

router.get("/logout", logout);

router.delete("/user/:userId", isAuthorized, deleteAccount)

router.get("/user-info", getInfo);

module.exports = router;