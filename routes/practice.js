var express = require('express');
var path = require('path');
var ObjectId = require('mongodb').ObjectID;
const router = express.Router()
const mongoose = require("mongoose");
const ejs = require('ejs');

// Models
var users = mongoose.model("users");
var topics = mongoose.model("topics");
var questions = mongoose.model("questions");

router.get("/", (req, res) => {
    topics.find({}, (err, data) => {
        if (err) {
            throw err;
        }
        res.render(__dirname + "./../views/topic_list", {
            info: req.session.userInfo,
            topics: data
        });
    });
});

router.use(express.static(path.join(__dirname, './../public')));

router.get("/:topicId", (req, res) => {
    questions.find({ topic_id: req.params.topicId }, (err, data) => {
        res.send(data);
    });
});


module.exports = router;