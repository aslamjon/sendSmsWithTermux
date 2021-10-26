const express = require('express');
const path = require("path");
const cors = require('cors');
require("dotenv").config();
const { exec } = require("child_process");
const fs = require('fs');
const axios = require('axios');
const { writeData } = require('./utiles');
const temp = require('./data/temp.json');


const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ extended: true })) // if json come backend then it convert to obj in req.body

const { AWS, APP_PORT  } = process.env;

function getSaveAndPostUrl(serverName='') {
  axios.get('http://localhost:4040/api/tunnels')
    .then(response => {
      let server = '';
      response.data.tunnels.forEach((value) => {
        // server[value.name] = value.public_url;
        if (serverName && value.name == serverName) server = value.public_url;
        else if (!serverName && value.name == 'server') server = value.public_url;
      })
      if (server) temp.server = server;
      writeData('./data/temp.json', temp);
    })
    .catch(error => {
      console.log("first",error);
    });
  const bodyForPost = { url: temp.server };
  
  axios.post(`${AWS}/api/sms`, bodyForPost)
    .then(response => {
      console.log(response.data);
    }).catch (e => console.log("second",e))
  return 'Tunnel has been sent to AWS'
}

getSaveAndPostUrl()

async function getTunnels(req, res) {
  const { serverName } = req.query;
  res.send(getSaveAndPostUrl(serverName));
}


app.use('/', express.static("./public"));
app.get("/", express.static(path.join(__dirname, "./public")));
app.get('/tunnels', getTunnels);

function getCode(){
  let code = Math.floor(Math.random() * 1000000);
  if (code.length != 6) getCode();
  else return code;
}

function execute(command='', success={}) {
  exec(`${command}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      res.send({ message: error.message });
      // return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      res.send({ message: stderr })
      // return;
    }
    res.send(success);
    console.log(`stdout: ${stdout}`);
  });
}

app.post('/', (req, res) => {
  let { phone, text } = req.body;
  console.log("came post request");
  let code = getCode();
  temp.phoneNumber[phone] = code;
  writeData('./data/temp.json',temp);
  code = `Confirm code: ${code}`;
  execute(`termux-sms-send -n ${phone} ${code}`, { message: `SMS has been sent successfully`, phone });
})

app.post('/confirm', (req, res) => {
  const { phone, code } = req.body;
  if (!phone && !code) res.status(400).send({ message: "Bad request" });
  else {
    let keys = Object.keys(temp.phoneNumber);
    // console.log(keys)
    if (!keys.includes(phone)) res.status(404).send({ message: "phone number not found" });
    else {
      if (temp.phoneNumber[phone] == code ) res.send({ message: "checked", login: true });
      else res.send({ message: "not pass inspection", login: false });
    }
  }
})

// Error handle
app.use(function (err, req, res, next) {
  // console.log("[Global error middleware]", err.message);
  res.status(500).send({
    message: err.message
  })
  next();
})


const PORT = APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`)
});