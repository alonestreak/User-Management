const jwt = require('jsonwebtoken');
const fs = require('fs');

const read_file=()=>{
    return fs.readFileSync('user_data.json');
}

const findUserById=(id)=>{
    users=JSON.parse(read_file());
    if(users.length==0){
        return false;
    }
    for(let i=0;i< users.length;i++){
        if(users[i].id=== id){
            return users[i];
        }
    }
    return false;
}

//middleware to check the JWT auth token in the header and if apropriate user is present then it will attach token,user id and user to request
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.jwt_secret);
        if(decoded){
            const file=JSON.parse(read_file());
            let user = findUserById(decoded.id);
            if (!user) {
                res.status(401).send({error: "Inappropriate ID in JWT"});
                return;
            }
            //jwt token is correct and user also found. attach token,user-id and user to request and leave middleware
            req.token = token;
            req.user=user;
            req.decodedId = decoded.id;
            next()
        }else{
            res.status(401).send({error: "provide the correct authentication token"});
        }
    } catch (e) {
        res.status(500).send({ error: 'Internal Server Error' })
    }
}

module.exports = auth