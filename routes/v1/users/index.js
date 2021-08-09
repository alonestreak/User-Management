const express= require('express');
const routes= express.Router();
const users= require('./users');

routes.use('/user',users);

module.exports= routes;