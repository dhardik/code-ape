const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    topic_id: ObjectId,
    topic_title: String,
    title: String,
    difficulty: String,
    author: String
});

mongoose.model("questions", questionSchema);