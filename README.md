Basic **User-Management system** using node.js,express.js,jsonwebtokens and bcrypt.js.<br/>
Following endpoints are available:<br/>
1]Register API<br/>
Ex : http://localhost:3000/routes/v1/user/register<br/>
We need to specify email,mobile number,name,password and profile picture. email should be unique. In response we get the user details.<br/>
2]Login API <br/>
Ex : http://localhost:3000/routes/v1/user/login<br/>
We need to provide email and password, If email and password are correct it will return the response with signed JWT token.<br/>
3]Show others profile API<br/>
Ex : http://localhost:3000/routes/v1/user/userinfo/12f99df8-97f8-41d3-afde-3cad9d75f985</br>
User need to pass authentication token in header of the request and ID of the user as a query parameter.<br/>
4]Show your own profile API <br/>
Ex : http://localhost:3000/routes/v1/user/myinfo<br/>
User just need to provide JWT token in header and information will be fetched from the information present in the token.<br/>
5] Update profile information(except password)<br/>
Ex : http://localhost:3000/routes/v1/user/updateinfo<br/>
User need to provide updated information in the request and data will be updated.<br/>
6] Update password API <br/>
Ex : http://localhost:3000/routes/v1/user/changePassword<br/>
User need to provide old password along with new password. In order to successfully change password old password should be correct and new password and old password should not be same.<br/>
7] All the images uploaded by the user will be stored in the uploads folder and folder is made static using express. so we can access any image using endpoints similar to follow.<br/>
Ex : http://localhost:3000/2.png
