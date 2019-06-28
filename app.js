//app.js
//loaded package
//라우팅 및 서버생성에 필요한 패키지
const http = require('http');
const path = require('path');
const static = require('serve-static');
const express = require('express');
const bodyPaser = require('body-parser');
const userRoute = require('./route/user');
const userModel = require('./model/userModel')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const assert = require('assert');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    url : 'mongodb://localhost:27017/testerDB',
    collection : 'mySessions'
});



//mongoose 구동을 위한 패키지
const mongoose = require('mongoose');
const databaseurl = 'mongodb://localhost:27017/testerDB';
console.log('connecting to the database!');
mongoose.Promise = global.Promise;
mongoose.connect(databaseurl);
const database = mongoose.connection;
database.on('error',console.error.bind(console,'mongoDB connection error')); 
console.log('connected to the database.');

//라우팅 및 서버생성에 필요한 패키지
var app = express();

//set up
app.set('port',process.env.PORT || 8080);
app.set('views',__dirname+'/views');
app.set('view engine','ejs');

app.use(bodyPaser.urlencoded({extended : true}));
app.use(bodyPaser.json());
app.use(static(path.join(__dirname,'/')));
app.use(flash());
app.use(cookieParser());//쿠기파서 설정
//app.use(session) = flash 모듈 미들웨어 값 설정
app.use(session({
    secret : 'sdssfscjnhsdkloijfdksoijfvk',//세션 설정시 의 key값이다.
    resave : true,//저장하고 불러오는 과정에서 세션을 다시 저장할 건지 정하는 것
    saveUninitialized : true,//세션을 저장할 떄, 초기화를 해줄지를 선택하는 방법.
    cookie : {maxAge :3600000, httpOnly : true},//쿠기 설정 : maxAge는 시간(밀리세컨드 단위)설정 httponly : true = 보안 목적
    store : store,//어떤 방식, 장소에 저장 할 것인지
    rolling : true
}));
app.use(helmet.hsts({
    maxAge : 10886400000,
    includeSubDomains : true
}));
//==================DB에서 찾은 사용자의 정보를 세션에 저장하는 과정=========================
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(Email,done){
    userModel.findOne({Email : Email}, function(err, user){
        done(err, user);
    });
});

//Catch errors
store.on('error', function(error){
    assert.ifError(error);
    assert.ok(false);
});
//===================여기까지가 미들웨어 설정===============================================
//local login
passport.use('local-login', new LocalStrategy({
    usernameField : 'Email',
    passwordField : 'PW',
    passReqToCallback : true
}, (req,Email,PW, done) =>{
    userModel.findOne({'Email' : Email, 'PW' : PW}, (err, user) =>{
        if(err) return done(err);
            
        if(!user){//이 경우 회원이 아니므로
            console.log('userID not found')
            return done(null, false);//false 값을 주어 로그인이 되지 않습니다.
        }
        if(!passport.authenticate(PW)){//회원은 맞는데 암호를 맞게 입력 했는지 확인하는 것
            console.log('!user.authenticate activated = PW is incorrect');
            return done(null, false);//암호가 틀리면 역시 false값을 주어 로그인이 되지 않는다.
        }
        else{
            console.log('this is user in app.js',user);
            return done(null, user);//조건에 부합하여 로그인 정보를 user라는 이름으로 리턴한다.
        }
    })
}));
//naver로 로그인
passport.use('naver', new NaverStrategy({
    clientID : 'WLIj3VHT6mxIFaHQA_U0',
    clientSecret : 'zCG9a1O1Ei',
    callbackURL : 'http://localhost:8080/naver_oauth'
},  (accessToken, refreshToken, profile,callback)=>{
    userModel.findOne({sns : 'naver', Email : profile.id}, (err,user)=>{
        if(err){return callback(err);}//그냥 오류나면 err로 콜백
        if(!user){//해당 연동 계정이 내 웹사이트 DB에 없으면 새로 만든다.
            const rawemail = JSON.stringify(profile.emails);
            const emailArray = rawemail.split('"');
            const email = emailArray[3];
            console.log('this is convert email  : ', email);
            userModel.create({
                name : profile.displayName,
                Email : email,
                token : accessToken},   function(err,user){
                    if(err) {
                        console.log('error detected!');
                        return callback(err);
                    }
                    else{callback(null,user);}
                }
            );
        }
        else{//해당 연동 계정이 내 웹사이트에 있으면 접속날짜를 갱신(이기능은 미구현이지만 써놓긴 하겠다.)하고 접속.
            const  temp = accessToken;
            const temp2 = new Date();
            // userModel.findByIdAndUpdate(user._id,{ $set : {lastvisited : temp2, token : temp}}, function(err,user){
            //     if(err){return callback(err);}
            //     callback(null,user);
            // })
            userModel.findById(user._id,(err,user)=>{
                if(err){
                    return callback(err);
                }
                else{
                    callback(null,user);
                }
            })
        }
    })
}))
//라우터 경로들 

app.use('/',userRoute);
app.use('*', (req, res ) => {
    return res.render('404.ejs')
})

//서버 생성
http.createServer(app).listen(app.get('port'),function(){
    console.log('Express server is activated Port : '+app.get('port'))
})

//데이터베이스 닫기
console.log("closing database");
database.on('close',function(){
    console.log("database close()")
    database.close();
})