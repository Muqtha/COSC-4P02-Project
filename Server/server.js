const express = require("express");
const app = express();
const mysql = require("mysql"); //for the database and connection to mysql
const cors = require("cors"); //a library that allows a request from my frontend to my api

app.use(cors());
app.use(express.json());

var tablenames;

const db = mysql.createConnection({
    user: "root",
    host: "127.0.0.1",
    password: "pegasus",
    database: "db",
});

// app.post("/keywords", (req,res) => {
//     tablenames = req.body.tablename;
// })

app.get("/answers", (req,res) => {
    db.query("SHOW FULL TABLES", 
    (err,result) => {
        if(err){
            console.log(err);
            res.status(400).send(err);
        }
        else{
            console.log(result);
            res.send(result);
        }
    })
});

app.listen(3001, ()=> {console.log("Awesome your port is running on 3001")});