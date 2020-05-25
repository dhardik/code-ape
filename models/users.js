const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email : String,
    password : String,
    name : String,
    gender : String,
    country : String,
    role : String,
    user_pic : String,
    score : Number ,
    phno : Number
});

mongoose.model("users",userSchema);