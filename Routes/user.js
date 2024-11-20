const express = require('express');
const userCtrl = require('../Controller/userController.js');
const clientModel = require('../Model/clientModel.js');
const groupModel = require('../Model/groupModel.js');

const routes = express.Router();

routes.get('/registrationPage', userCtrl.registrationPage);

routes.post('/register',clientModel.uploadimage,userCtrl.register);

routes.get('/', userCtrl.loginPage);

routes.post('/login',userCtrl.login);

routes.get('/chat',userCtrl.Chat);

// GROUP CHATS

routes.post('/createGroup/:id', groupModel.uploadimage, userCtrl.createGroup);

module.exports = routes;