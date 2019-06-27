const express = require('express');
const mongoose = require('mongoose');
//스키마 작성
const userSchema = mongoose.Schema({
    Email : {type : String, require : true},
    PW : {type : String, require : true},
    name : {type : String, require : true}
})
//데이터 베이스 모델 작업

//스키마 -> 모델
const usermodel = mongoose.model("userList", userSchema);

module.exports = usermodel;