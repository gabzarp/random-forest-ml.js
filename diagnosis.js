
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
Diagnosis.prototype.saveDataset = async function(file){
    if(file){
        let reader = fs.createReadStream(file.path);
        reader.on('open', () =>{
            let stream = fs.createWriteStream('./diagnosis.json');
            stream.on('open', () => {
                reader.pipe(stream);
            }).on('end', () => {
                this.dataset = JSON.parse(fs.readFileSync("./diagnosis.json"))
            })
        })
    }
}

Diagnosis.prototype.getDataset = function() {
    try{
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
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }
    const classes = this.getClasses();
    const distinctClasses = classes.filter(distinct);
    return distinctClasses;
};

