const express= require('express');
const app= express();
require('dotenv').config();
const port=process.env.port || 5000;
const bodyParser= require('body-parser');
const userRoutesController= require('./routes/v1/users');

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//to serve images in uploads folder as static files
app.use(express.static('uploads'));

app.use('/routes/v1',userRoutesController);

app.listen(port,()=>{
    console.log("app running on port ",port)
});