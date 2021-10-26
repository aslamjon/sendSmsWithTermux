const fs = require('fs');
const path = require("path");

const writeData = (filename, content) => {
    fs.writeFile(filename, JSON.stringify(content, null, 4), 'utf8', (err) => {
        if (err) console.log(err);
    })
}

module.exports = {
    writeData
}