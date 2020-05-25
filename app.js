const express = require('express');
const app = express();
var path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
var fs = require('fs');
const cp = require('child_process');
var port = 3000;

//Connect with db
var mongoDB = 'mongodb://localhost/codeape';

mongoose.connect(mongoDB);

mongoose.connection.on('error', (err) => {
    console.log('DB connection Error');
});

mongoose.connection.on('connected', (err) => {
    console.log(mongoDB + ' connected !');
});

// Models
require("./models/users");
require("./models/topics");
require("./models/questions");
var users = mongoose.model("users");
var topics = mongoose.model("topics");
var questions = mongoose.model("questions");

// setting up session
var session = require('express-session');

app.use(session({
    secret: "xYzUCAchitkara",
    resave: true,
    saveUninitialized: true
}));

// setting up templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Parser of JSON and stores data to body in req
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Access static files
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    if (req.session.userInfo == undefined && req.url != "/login") {
        res.redirect("/");
    }
    else {
        next();
    }
});

// setting up routes
const admin = require("./routes/admin");
const oauth = require("./routes/oauth");
const practice = require("./routes/practice");
app.use("/admin", admin);
app.use("/oauth", oauth);
app.use("/practice", practice);


// setting up compile-run package
const { c, cpp, node, python, java } = require('compile-run');


// app.get("/test", (req, res) => {
//     bcrypt.hash('hardik', 10, (err, hash) => {
//         if (err) {
//             throw hash;
//         }
//         else {
//             var newUser = new users({
//                 email: 'hardikmishra52@gmail.com',
//                 password: hash,
//                 name: 'Hardik Mishra',
//                 gender: 'Male',
//                 country: 'India',
//                 role: 'admin',
//                 user_pic: 'https://lh3.googleusercontent.com/a-/AOh14Gj0dO-yZ9QO83Tc3spvBV4AR1tkHP0X4KVY0CObuQ',
//                 score: 100,
//                 phno: 8544327919
//             });
//             newUser.save((err, data) => {
//                 if (err) {
//                     throw err;
//                 }
//                 else {
//                     console.log(data);
//                     console.log("saved !!!!!");
//                 }
//             });
//         }
//     });
// });

app.post("/login", (req, res) => {
    users.findOne({ email: req.body.email }, (err, data) => {
        if (err) {
            throw err;
        }
        else if (data == null) {
            res.send("no");
        }
        else {
            bcrypt.compare(req.body.password, data.password, (err, match) => {
                if (err) {
                    throw err;
                }
                else if (match) {
                    if (data.role == "admin") {
                        req.session.userInfo = {
                            db_id: data._id,
                            email: data.email,
                            name: data.name,
                            user_pic: data.user_pic,
                            role: data.role
                        };
                        res.send("admin");
                    }
                }
                else {
                    res.send("no");
                }
            });
        }
    });
});

app.get("/code", (req, res) => {
    res.render("ide", { info: req.session.userInfo });
});

app.post("/runsource", (req, res) => {
    var options = {
        stdin: req.body.input,
        timeout: 5000,
        compileTimeout: 5000
    };
    if (req.body.language == "c") {
        c.runSource(req.body.code, options, (error, result) => {
            if (error) {
                throw error;
            }
            if (result.errorType == "compile-time") {
                res.send(result.stderr);
            }
            else if (result.errorType == "run-time") {
                res.send("Execution time-out !");
            }
            else {
                res.send(result.stdout);
            }
        });
    }
    else if (req.body.language == "cpp") {
        cpp.runSource(req.body.code, options, (error, result) => {
            if (error) {
                throw error;
            }
            if (result.errorType == "compile-time") {
                res.send(result.stderr);
            }
            else if (result.errorType == "run-time") {
                res.send("Execution time-out !");
            }
            else {
                res.send(result.stdout);
            }
        });
    }
});

app.post("/download_code", (req, res) => {
    var content = "// author : " + req.session.userInfo.email + "\n";
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    content += "// date_created : " + dateTime + "\n\n\n";
    content += req.body.code;
    fs.writeFile(__dirname + "/download/code." + req.body.language, content, (err) => {
        if (err) {
            throw err;
        }
        res.send(req.body.language);
    });
});

app.get("/download_code", (req, res) => {
    res.download(__dirname + "/download/code." + req.query.lang, "code." + req.query.lang, (err) => {
        if (err) {
            throw err;
        }
        cp.execSync("rm --force code." + req.query.lang, { cwd: __dirname + "/download/" });
    });
});

app.get("/changepassword", (req, res) => {
    res.render("changepassword", { info: req.session.userInfo });
});

app.post("/changepassword", (req, res) => {
    console.log(req.session);
    users.findOne({ _id: req.session.userInfo.db_id }, (err, data) => {
        if (err) {
            throw err;
        }
        else {
            bcrypt.compare(req.body.oldpwd, data.password, (err, result) => {
                if (err) {
                    throw err;
                }
                else if (result) {
                    bcrypt.hash(req.body.newpwd, 10).then((hash) => {
                        users.updateOne({ _id: data._id }, { $set: { password: hash } }).then((info) => {
                            res.send("Password changed successfully !!");
                        });
                    });
                }
                else {
                    res.send("Old password don't match");
                }
            })
        }
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.listen(port, () => console.log(`server listening on port ${port}!`));