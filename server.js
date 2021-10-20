const express = require('express');
const path = require("path");
const cors = require('cors');
require("dotenv").config();
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}))
app.use(express.json({extended: true})) // if json come backend then it convert to obj in req.body


app.use('/', express.static("./public"));
app.get("/", express.static(path.join(__dirname, "./public")));
app.post('/', (req, res) => {
    const {phone, text} = req.body;

    exec(`termux-send-sms -n ${phone} ${text}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
})
// Error handle
app.use(function(err, req, res, next) {
    // console.log("[Global error middleware]", err.message);
    res.status(500).send({
        message: err.message
    })
    next();
})


const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
});