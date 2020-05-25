const router = require("express").Router();
const passport = require("passport");
const GoogleStratgy = require("passport-google-oauth20");
const keys = require("./keys");

// auth with google
router.get("/google", passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get("/google/oauth/redirect", (req, res) => {
    console.log(req.body);
});

// Passportjs things and stuffs 
passport.use(
    new GoogleStratgy({
        callbackURL: '/oauth/google/redirect',
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, (accessToken, refreshToken, profile, done) => {
        // console.log(profile);
        var obj = {
            email: profile.emails[0].value,
            password: "",
            name: profile.displayName,
            gender: "Male",
            country: "India",
            role: "admin",
            user_pic: profile.photos[0].value,
            score: 100
        };
        console.log(obj);
        // var newUser = new users({
        //     email: profile.emails[0].value,
        //     password: "",
        //     name: profile.displayName,
        //     gender: "Male",
        //     country: "India",
        //     role: "admin",
        //     user_pic: profile.photos[0].value,
        //     score: 100
        // });
        // done(null,profile);
    })
);

// callback redirect form google
router.get("/google/redirect", passport.authenticate('google'), (req, res) => {
    res.send("Callback from google received !!");
});

// Exporting this route
module.exports = router;