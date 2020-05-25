const mongoose = require("mongoose");
const ObjectId = require('mongodb').ObjectID;
const Schema = mongoose.Schema;

const topicSchema = new Schema({
    title: String,
    description: String,
    pic: String,
    created_by: ObjectId
});

mongoose.model("topics", topicSchema);