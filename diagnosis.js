
var fs = require('fs');
const path = require('path');

// let rawdata = fs.readFileSync('diagnosis.json');  
// let dataset = JSON.parse(rawdata);  
module.exports = Diagnosis;
function Diagnosis(){
    try{
        this.dataset = JSON.parse(fs.readFileSync("./diagnosis.json"))
    }catch(e){
        this.dataset = null
    }
}
Diagnosis.prototype.saveDataset = function(file){
    if(file){
        let reader = fs.createReadStream(file.path);
        let stream = fs.createWriteStream('./diagnosis.json');
        stream.on('open', function(){
            reader.pipe(stream);
        }).on('end', function(){
            this.dataset = JSON.parse(fs.readFileSync("./diagnosis.json"))
        })
    }

    console.log('diagnosis.json uploaded');
    return;
}

Diagnosis.prototype.getDataset = function() {
    try{
        this.dataset.map(d => console.log(d.lenght))
        return this.dataset.slice();
    }
    catch (e){
        return null
    }
};

Diagnosis.prototype.getNumbers = function() {
    try{
        return this.dataset.map(d => d.slice(0, d.slice().length-1));
    }
    catch (e){
        return null
    }
};

Diagnosis.prototype.getClasses = function() {
    try{
        return this.dataset.map(d => d[d.slice().length-1]);
    }
    catch (e){
        return null
    }
};

Diagnosis.prototype.getDistinctClasses = function() {
    return ['no', 'yes'];
};

