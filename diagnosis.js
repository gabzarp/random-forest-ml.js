
var fs = require('fs');
const path = require('path');

// let rawdata = fs.readFileSync('diagnosis.json');  
// let dataset = JSON.parse(rawdata);  
module.exports = Diagnosis;
function Diagnosis(){
    this.dataset = JSON.parse(fs.readFileSync("./diagnosis.json"))
}
Diagnosis.prototype.saveDataset = function(file){
    if(file){
        let reader = fs.createReadStream(file.path);
        let stream = fs.createWriteStream('./diagnosis.json');
        stream.on('open', function(){
            reader.pipe(stream);
        })
    }
    this.dataset = JSON.parse(fs.readFileSync("./diagnosis.json"))

    console.log('diagnosis.json uploaded');
    return;
}

Diagnosis.prototype.getDataset = function() {
    return this.dataset.slice();
};

Diagnosis.prototype.getNumbers = function() {
    return this.dataset.map(d => d.slice(0, d.length));
};

Diagnosis.prototype.getClasses = function() {
    return this.dataset.map(d => d.length);
};

Diagnosis.prototype.getDistinctClasses = function() {
    return ['no', 'yes'];
};

