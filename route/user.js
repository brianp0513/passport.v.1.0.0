const express = require('express');
const router = express.Router();
const userModel = require('../model/userModel');
const passport = require('passport');
const async = require('async');
const cookieParser = require('cookie-parser');



//-----------------------------------------메인페이지(로그인화면)------------------------------------------------
router.get('/',function(req,res){
    console.log('login page reqest called!');
    return res.render('../views/loginpage.ejs',{'message' : req.flash('loginMessage')});
})
//로그인 시 
router.post('/login',(req,res,next) =>{
    if(req.body.Email.length ===0 || req.body.PW.length ===0){//ID나 비밀번호 칸이 공란일 경우, 로그인 페이지로 리턴
        console.log('TYPE ID OR PW');
        res.render('../views/loginpage.ejs');
    }
    else{
        console.log('this is req.body.Email : ',req.body.Email);
                    console.log('this is req.body.PW : ',req.body.PW);
                    //세션 생성
                    req.session.user = {
                    Email : req.body.Email,
                    PW    : req.body.PW,
                    authenticate : true
                    }
                    
        console.log('pass next in /login router');
        next();//아니면 다음 조건으로 가라
    }
    //passport.authenticate = passport 인증 routing method
},passport.authenticate('local-login', {
    successRedirect : '/user', //성공시 메인페이지로 라우팅 설정
    failureRedirect : '/', //실패시 로그인 페이지로 라우팅 설정
    failureFlash : true})
//소스코드에선 successRedirect 가 /temp되었는데 그 이유는 이 유저가 이메일 인증 했는지 확인 하기 위해서 이지만, 나는 거기까지 가지 안아서 그냥 메일 페이지로 리턴 시킨다. 
);
function checkUser(req,res,next){
    var isValid = true;
    const datas = userModel;
    async.waterfall(
        [function(callback){
            //DB처리부분
            datas.findOne({Email : req.body.Email, PW : req.body.PW}, 
                function(err,user){
                    console.log(user);
                if(err){
                    isValid = false;
                }
                else{
                callback(null, isValid);
                }
            }
        );
        }], function(err, isValid){
            if(err) return res.json({success : "false", message : err});
            if(isValid){
                return next();
            }
            if(!isValid){
                console.log('isValid is false');
                res.render('../views/loginpage.ejs');
            }
            else{
                console.log('back function is called');
                res.redirect("back");
            }
        }
    )
}
router.get('/user',checkUser ,function(req,res,next){
    userModel.findOne(req.session.Email, function(err,user){
        if(err) return res.render('../views/error.ejs',{error : err})
        else{
            console.log('this is user', user);
            return res.render('../views/mainpage.ejs',{'user' : user})
        }
    })
})
//===============================네이버를 연동해서 로그인 하기=================
function isLoggedIn(req,res,next){
    if(!req.authenticate()){
        return next();
    }else{
        red.render('../views/loginpage.ejs');
    }
}
router.get('/auth/naver',isLoggedIn, passport.authenticate('naver',{
    successRedirect : '/user',
    failureRedirect : '/'
}))
router.get('/naver_oauth',passport.authenticate('naver',{
    successRedirect : '/user',
    failureRedirect : '/'
}))

//================================가입기능====================================
//checkUserRegValidation는 기입된 정보가 기존의 데이터베이스에 있는 중복된 정보인지 확인하는 함수이다.
function checkUserRegValidation(req,res,next){
    var isValid = true;
    async.waterfall(
        [function(callback){
            //DB처리부분
            userModel.findOne({Email : req.body.Email, PW : req.body.PW}, 
                function(err,user){
                if(user){
                    isValid = false;
                }
                callback(null, isValid);
            }
        );
        }], function(err, isValid){
            if(err) return res.json({success : "false", message : err});
            if(isValid){
                return next();
            }
            if(!isValid){
                console.log('isValid is false');
                res.render('../views/loginpage.ejs');
            }
            else{
                console.log('back function is called');
                res.redirect("back");
            }
        }
    )
}
//로그인 창에서 가입버튼 눌렀을 떄 행동
router.post('/gotoregister',(req,res)=>{
    return res.render('../views/register.ejs');
})
//회원가입 창에서 가입완료 버튼을 눌렀을 떄 행동
router.post('/register',checkUserRegValidation ,(req,res)=>{
    const savedata = new userModel({
        Email : req.body.Email,
        PW : req.body.PW,
        name : req.body.name
    })
    savedata.save()
                    .then( result =>{
                        if(!result){
                            return console.log('CANNOT SAVE DATA');
                        }
                        else{
                            return res.render('../views/loginpage.ejs',{message : req.flash('sign-up complete!')});
                        }
                    })
})
//====================================세션 존재 여부 체크===============================================
router.post('/test', (req,res)=>{
    if(req.session.user){
        console.log('sesssion exist! : ',req.session.user);
        return res.render('../views/exist.ejs');
    }
    else{
        console.log('session does not exist ');
        return res.render('../views/notexist.ejs');
    }
})




module.exports = router;
    
