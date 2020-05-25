var express = require('express');
var path = require('path');
var ObjectId = require('mongodb').ObjectID;
const router = express.Router()
const mongoose = require("mongoose");
const ejs = require('ejs');
var multer = require('multer');
var fs = require('fs');

router.use(express.static(path.join(__dirname, './../public')));

// Models
var users = mongoose.model("users");
var topics = mongoose.model("topics");
var questions = mongoose.model("questions");

router.use(function (req, res, next) {
    if (req.session.userInfo == undefined) {
        res.redirect("/");
    }
    else if (req.session.userInfo.role != "admin") {
        res.redirect("/");
    }
    else {
        next();
    }
});

function sanitizeFile(req, file, cb) {
    // Define the allowed extension
    let fileExts = ['png', 'jpg', 'jpeg', 'gif']
    // Check allowed extensions
    let isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
    // Mime type must be an image
    let isAllowedMimeType = file.mimetype.startsWith("image/")
    if (isAllowedExt && isAllowedMimeType) {
        topics.find({ title: req.body.title }, (err, data) => {
            if (err) {
                throw err;
            }
            if (data.length != 0) {
                cb('Error: Topic already exists!');
            }
            else {
                return cb(null, true); // no errors
            }
        });
    }
    else {
        // pass error msg to callback, which can be displaye in frontend
        cb('Error: File type not allowed!');
    }
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/topic/");
    },
    filename: function (req, file, cb) {
        cb(null, req.body.title + '.' + file.originalname.split('.')[1].toLowerCase())
    }
})

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter: function (req, file, cb) {
        sanitizeFile(req, file, cb);
    }
}).single('topic_pic');


router.get("/profile", (req, res) => {
    users.find({ _id: req.session.userInfo.db_id }, (err, data) => {
        if (err) {
            throw err;
        }
        else {
            res.render(__dirname + "./../views/profile", { info: data[0] });
        }
    });
});

router.get("/add_question/:topicId", (req, res) => {
    topics.findOne({ _id: req.params.topicId }, (err, data) => {
        if (err) {
            throw err;
        }
        res.render("./admin/add_question_form", {
            info: req.session.userInfo,
            topic_info: data
        });
    });
});

router.post("/add_question/:topicId", (req, res) => {
    var fileContent = req.body;
    fileContent.author = req.session.userInfo.email;
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    fileContent.date_created = dateTime;
    fileContent.topicId = req.params.topicId;
    topics.findOne({ _id: req.params.topicId }, (err, topic_data) => {
        if (err) {
            throw err;
        }
        fileContent.topicTitle = topic_data.title;
        var newQuestion = new questions({
            topic_id: topic_data._id,
            topic_title: topic_data.title,
            title: fileContent.title,
            difficulty: fileContent.difficulty,
            author: fileContent.author
        });
        newQuestion.save((err, question_data) => {
            if (err) {
                throw err;
            }
            else {
                var fileName = question_data._id;
                fileName += '.txt';
                fs.writeFile(__dirname + "/../public/questions/" + fileName, JSON.stringify(fileContent), (err) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        res.send("One question added to " + question_data.topic_title + "!!");
                    }
                });
            }
        });
    });
});

router.get("/select_topic", (req, res) => {
    topics.find({}, { title: true }, (err, data) => {
        if (err) {
            throw err;
        }
        res.render(__dirname + "./../views/admin/select_topic_form", {
            info: req.session.userInfo,
            topics: data
        });
    });
});

router.get("/add_topic", (req, res) => {
    res.render(__dirname + "./../views/admin/add_topic_form", {
        info: req.session.userInfo
    });
});

router.post("/add_topic", (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render(__dirname + "./../views/admin/msg_page", {
                info: req.session.userInfo,
                msg: err
            });
        } else {
            // If file is not selected
            if (req.file == undefined) {
                res.render(__dirname + "./../views/admin/msg_page", {
                    info: req.session.userInfo,
                    msg: 'No File selected!'
                });
            }
            else {
                var newTopic = new topics({
                    created_by: req.session.userInfo.db_id,
                    description: req.body.desc,
                    pic: "/topic/" + req.file.filename,
                    title: req.body.title
                });
                newTopic.save((err, data) => {
                    if (err) {
                        throw err;
                    }
                    res.render(__dirname + "./../views/admin/msg_page", {
                        info: req.session.userInfo,
                        msg: data.title + ' added successfully!',
                        topic_info: {
                            title: data.title,
                            url: "/admin/add_question/" + data._id
                        }
                    });
                });
                // res.send({ 'msg': 'File uploaded successfully!' });
            }
        }

    });
});

router.get("/delete_topic", (req, res) => {
    res.send(req.query);
});

module.exports = router;