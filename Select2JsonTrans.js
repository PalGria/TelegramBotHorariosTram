//preparamos el fichero json de estaciones de tram transformando el select de su web a json
const fs = require('fs');
let lineReader = require('readline').createInterface({
  input: fs.createReadStream('paradas.txt')
});

//creo que esto se puede hacer con una sola regex pero las regex me dan pereza ahora mismo
let regexQuotes =  /\"(.*?)"/; //esta regex captura lo que encontramos entre comillas, en este caso el value
let regexStation =  /\>(.*?)</; //esta regex captura lo que encontramos entre >  <, o lo que es lo mismo, el nombre de la estación
let estaciones = [];
lineReader.on('line', function (line) {
  let matchedQoutes = regexQuotes.exec(line);
  let matchedStation = regexStation.exec(line);
  if(matchedQoutes != null && matchedStation != null){
    console.log(matchedQoutes[1] + " " + matchedStation[1]);
    let estacion = {};
    estacion.id = matchedQoutes[1];
    estacion.nombre = matchedStation[1];
    estaciones.push(estacion); 
  }
  else { 
    if(estaciones.length != 0){ 
      fs.writeFileSync('./paradas.json', JSON.stringify(estaciones));
    }
  }
});

