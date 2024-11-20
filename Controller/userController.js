const clientModel = require('../Model/clientModel.js');
const groupModel = require('../Model/groupModel.js');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const db = require('../Config/db.js');
dotenv.config();

module.exports.registrationPage = (req,res) => {
    try{
        return res.render('registration.ejs');
    }
    catch(e){
        console.log(e);
        console.log("Something went wrong");
    }
};

module.exports.register = async (req,res) => {
    try{
        if(!req.body){
            console.log("Please fill the form");
        }

        var img = '';

        if(!req.file){
            console.log("Please select an image");
        }

        img = clientModel.imagepath + '/' + req.file.filename;

        let password = req.body.password;

        password = await bcrypt.hash(password,10);

        const data = db.query(`select create_client($1,$2,$3,$4)`,[req.body.name,req.body.email,password,img]);

        if(!data){
            console.log("Data not inserted");
        }

        return res.redirect('/');
    }
    catch(e){
        console.log(e)
        console.log("Something went wrong");
    }
};

module.exports.loginPage = (req,res) => {
    try{
        return res.render('login.ejs');
    }
    catch(e){
        console.log(e);
        console.log("Something went wrong");
    }
};

module.exports.login = async (req,res) => {
    try{
        if(!req.body){
            console.log("Please fill the form");
        }

        const checkEmail = await db.query(`select * from login($1)`,[req.body.email]);

        if(!checkEmail){
            console.log("Email is incorrect");
        }

        const checkPass = await bcrypt.compare(req.body.password,checkEmail.rows[0].password);

        if(!checkPass){
            console.log("Password is incorrect");
            return res.redirect('/');
        }
        else{
            res.cookie('user',checkEmail.rows);
            return res.redirect('/chat');
        }

    }
    catch(e){
        console.log(e);
        console.log("Something went wrong");
    }
};

module.exports.Chat = async (req,res) => {
    try{

        const currentUser = req.cookies.user;

        const userData = await db.query(`select * from get_user_data()`);
        const groupData = await db.query(`select * from group_tbl`);

        const User = {
            allUser : userData.rows,
            group: groupData.rows,
            currentUser : currentUser
        };

        return res.render('Chat.ejs',{User});
    }
    catch(e){
        console.log(e);
        console.log("Something went wrong");
        return res.render('404.ejs');
    }
};

module.exports.createGroup = async (req,res) => {
    try{
        if(!req.body){
            console.log("Please fill the form");
        }

        const aid = req.params.id;
        const {name, uid} = req.body;

        if(!req.file){
            console.log("Please select an image");
        }

        var img = '';

        img = groupModel.imagepath + '/' + req.file.filename;

        let uidArray;
        if (uid && typeof uid === 'object') {
            uidArray = Object.values(uid).flat().map(Number);
            console.log("uidArray: " + JSON.stringify(uidArray));
        } else {
            console.log("Invalid uid format");
            return res.status(400).send("Invalid uid format");
        }
     
        console.log(img);
        console.log("aid :- " + aid + " uid :- " + uidArray + " name :- " + name);


        const gData = await db.query(`INSERT INTO group_tbl(aid, uid, name, image) VALUES ($1, $2, $3, $4);`,[aid,uidArray,name,img]);

        console.log(gData);

        if(gData){
            console.log("Group created successfully");
            return res.redirect('/chat');
        }
        else{
            console.log("Something went wrong");
        }
    }
    catch(e){
        console.log(e);
        return res.render('404.ejs');
    }
};