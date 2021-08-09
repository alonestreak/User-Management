const uuid=require('uuid')
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer= require('multer');
const jwt = require('jsonwebtoken');


const auth = require('../../../middleware/auth');
const router= express.Router();



//all images will be stored in uploads folder
const fileStorageEngine=  multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads");
    },
    filename: (req,file,cb)=>{
        cb(null,file.originalname.toLowerCase().split(' ').join('-'));
    },
});

const maxSize= 2*1024*1024;
const upload= multer({storage:fileStorageEngine,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
        } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
      },
      limits: { fileSize:maxSize }
});


const read_file=()=>{
    return fs.readFileSync('user_data.json');
}

// register end point to register the user name,unique email, mobile number,password and profile image required
router.post('/register', upload.single("image"),async (req,res)=>{
    try{
        if(req.body.name===undefined || req.body.name===""){
            res.status(422).json({"error":"please provide the proper name"});
            return;
        }
        if(req.body.mobile===undefined || req.body.mobile==="" || req.body.mobile.length!=10){
            res.status(422).json({"error":"please provide the 10 digits mobile number"});
            return;
        }
        if( req.body.email===undefined || req.body.email===""){
            res.status(422).json({"error":"please provide the email"});
            return;
        }
        if( req.body.password===undefined || req.body.password===""){
            res.status(422).json({"error":"please provide the password"});
            return;
        }
        req.body.password= await bcrypt.hash(req.body.password,8);
        req.body.id=uuid.v4();
        req.body.path=req.file.path;
        let file= read_file();
        //to check any user is present in json file, if not create the empty array and add one user into array and write back to file
        if (Object.entries(JSON.parse(file)).length==0){
            file=[];
            file.push(req.body);
            fs.writeFile('user_data.json',JSON.stringify(file),function (err) {
                if (err) throw err;
             });   
             res.status(201).json(req.body);
        }else{
            //if there are users already present in json file just append user in json file and write back to the origin file
            let data = JSON.parse(file);
            for(let i=0; i<data.length;i++){
                if(data[i].email===req.body.email){
                    res.status(409).json({"message":"This email already exists"});
                    return;
                }
            }
            //If  email id is unique then allow user to register and store data into json file
            data.push(req.body);
            fs.writeFile('user_data.json',JSON.stringify(data),function (err) {
                if (err) throw err;
             });
             res.status(201).json(req.body);
        }   
    }catch(e){
        if(req.file ===undefined){
            res.status(400).json({"error":"please upload image"})
        }else{
            res.status(500).json({"error":"internal server error"});
        }
    }
    
});

const findUserByEmail=(email)=>{
    users=JSON.parse(read_file());
    for(let i=0;i< users.length;i++){
        if(users[i].email== email){
            return users[i];
        }
    }
    return false;
}


//login endpoint for user, to login successfully user must provide email and password
router.post('/login',async (req,res)=>{
    try{
        const email= req.body.email;
        const password=req.body.password;
        const user= findUserByEmail(email);
        if(user){
            //checking password given by user is correct 
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({"message":"Incorrect emailId / password"});
                return;
            }
            const token = jwt.sign({ id: user.id.toString() }, process.env.jwt_secret);
            res.status(200).json({"status":"sucessfully logged in","userName":user.name,"token":token});
        }else{
            res.status(401).json({"message":"Incorrect email ID"});
        }
       
    }catch(e){
        res.status(500).json({"error":"internal server error"});
    }
});

const findUserById=(id)=>{
    users=JSON.parse(read_file());
    for(let i=0;i < users.length;i++){
        if(users[i].id == id){
            return users[i];
        }
    }
    return false;
}


//endpoint to get other user info.
//User must provide authentication token in header which will be checked in middleware and userID is passed through the url
router.get('/userinfo/:userid', auth ,async(req,res)=>{
    try{
        let userid=req.params.userid;
        let reqUser=await findUserById(req.params.userid);
        if(reqUser){
            //sending all the fields except password.
            res.status(200).json({"User Info":{"id":reqUser.id,"name":reqUser.name,"email":reqUser.email,"mobileNo":reqUser.mobile,"profile picture":reqUser.path}});
        }else{
            res.status(400).json({"error":"Invalid user ID provided"});
        }
    }catch(e){
        res.status(500).json({"error":"internal server error"});
    }
});


//endpoint to get the own profile information
// all user data will be availabe through the authentication token present in header
router.get('/myinfo',auth, async(req,res)=>{
    try{
        //returning the user's information which we got from the middleware
        let user= req.user;
        res.status(200).json({"Own Info":user});
    }catch(e){
        res.status(500).json({"error":"internal server error"});
    }
});


//endpoint to update the all information except password, user must provide all other new values in body section.
//to update the own information user must have auth token in header
router.patch('/updateinfo',upload.single("path"),auth,async(req,res)=>{
    try{
        let user= req.user;
        let data=await JSON.parse(read_file());
        //updating the all the fields with new values
        for(let i=0;i<data.length;i++){
            if (data[i].id=== user.id){
                data[i].name=req.body.name;
                data[i].email=req.body.email;
                data[i].mobile=req.body.mobile;
                data[i].path=req.file.path
            }
        }
        res.status(200).json({"message":"Profile updated successfully!!"});
    }catch(e){
        res.status(500).json({"error":"internal server error"});
    }
});


//endpoint to change the password, user must provide both old and new password in body
//to change the password old password must match old password and old and new password cannot be same. 
router.patch('/changePassword',auth,async (req,res)=>{
    try{
        let user=req.user;
        let oldPassword=req.body.oldPassword;
        let newPassword=await bcrypt.hash(req.body.newPassword,8);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        //checking old given old password is correct or not
        if (!isMatch) {
            res.status(401).json({"message":"Incorrect old password!!"});
            return
        }
        //checking old and new passwords are same or not
        if(await bcrypt.compare(req.body.newPassword, user.password)){
            res.status(401).json({"message":"New Password can not be same as old password!!"});
            return;
        }

        //everything is correct store the new password
        let data=await JSON.parse(read_file());
        for(let i=0;i<data.length;i++){
            if (data[i].id=== user.id){
                data[i].password=newPassword;
            }
        }
        fs.writeFile('user_data.json',JSON.stringify(data),function (err) {
            if (err) throw err;
        });
        res.status(200).json({"message":"password changed successfully"});
    }catch(e){
        res.status(500).json({"error":"internal server error"});
    }
    
});


module.exports= router;