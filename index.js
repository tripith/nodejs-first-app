import path from "path";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";


mongoose.connect("mongodb://127.0.0.1:27017",{
  dbName:"backend"
}).then(c=>console.log("Database Connected"))
.catch((e)=> console.log(e));

const userSchema = new mongoose.Schema({
  
  name: String,
  email:String,
  password:String,
 
 
});

const User = mongoose.model("User",userSchema)

const App = express(); // create server
const users = [];
console.log(path.join(path.resolve(),"public"))
//using middleWares
App.use(express.static(path.join(path.resolve(),"public")));
App.use(express.urlencoded({extended: true}));
App.use(cookieParser());
//set engine
App.set("view engine","ejs");

const isAuthenticated = async(req,res,next)=>{
  const {token} = req.cookies;
  if(token) {
   const decoded = Jwt.verify(token,"trtrtr")
   req.user = await User.findById(decoded._id)
  // req.user = await User.findById(decoded._id);
   next();
  }
   else {
    res.redirect('login');
   }
}  

App.get("/",isAuthenticated,(req,res)=>{
  console.log(req.user);
  res.render("logout",{name:req.user.name }); 
});

App.get("/login",(req,res)=>{
  res.render("login");
})

App.get("/register",(req,res)=>{
  res.render("register");
});

App.post('/login',async (req,res)=>{
  const {email,password} = req.body;

  let user = await User.findOne({email});

  if(!user) return res.redirect("/register");
  
  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch) return res.render("login",{message: "password incorrect"});
  const token = Jwt.sign({_id:user._id},"trtrtr"); 
  res.cookie("token",token,{
    httpOnly:true,
    expires: new Date(Date.now()+60*1000)
   });
   res.redirect("/");
});


App.post("/register",async(req,res)=>{
  //console.log(req.body);

const {name,email,password}= req.body;
let user = await User.findOne({email})
if(user) {
  return res.redirect("/login");
}
const hashedPassword = await bcrypt.hash(password,10);
 user = await User.create({
  name,
  email,
  password: hashedPassword,
});
const token = Jwt.sign({
  _id:user._id
},"trtrtr");
console.log(token);
res.cookie("token",token,{
  httpOnly: true,
expires: new Date(Date.now()+60*1000),
})
res.redirect("/");
});

App.get("/logout",(req,res)=>{
  res.cookie("token", null, {
  httpOnly: true,
  expires: new Date(Date.now()),
  });
  res.redirect("/");
});
  
App.listen(5000, ()=>{
  console.log("Server is wroking in Express");
});
