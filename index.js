let API_KEY;
try{
	console.log("Leyendo API de archivo...")
	API_KEY = require('./apikey.js');	
}
catch(err){
	console.log("Leyendo API de Heroku...")
	API_KEY = process.env.TELEGRAMBOTKEY;
}


//este bot pedirá dos estaciones de tram y devolverá una url donde están los horarios de ese día
//La url a manejar será como esta. En el fichero paradas.json se encontrarán todas las paradas del tram. 
//https://www.tramalicante.es/horarios_pdf.php?origen=200&destino=4&fecha=13/12/2018&hini=00:00&hfin=23:59
const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const fs = require("fs");
const moment = require("./moment.js");
const express = require('express');
const expressApp = express();
const bot = new Telegraf(API_KEY)
const PORT = process.env.PORT || 3000;
let paradas = JSON.parse(fs.readFileSync('paradas.json','utf8'));
let paradasTeclado = []; 
let paradasAUX = [];
for(let i = 0; i< paradas.length; i++){
  if(i%3 == 0 && i  != 0){
    paradasTeclado.push(paradasAUX);
    paradasAUX = [];
  }
  paradasAUX.push(paradas[i].nombre);
}
if (paradasAUX.length > 0)
  paradasTeclado.push(paradasAUX);
//console.log(paradasTeclado);
bot.command(['help', 'ayuda'] , (ctx) => ctx.reply('Hola. Este bot te ofrece los horarios de las líneas de tram de Alicante. Simplemente escribe cualquier cosa o /start y podrás empezar. Aviso, la fuente de estos horarios es la web oficial del Tram de Alicante, no me responsabilizo de la precisión de dichos horarios.'));
bot.command("about",  (ctx) => ctx.reply('Hey, este proyecto, y algunos más se puede encontrar en mi GitHub https://github.com/PalGria. Si tienes alguna duda, queja o sugerencia, es un buen sitio para comentarla.'));
bot.start(ctx => {
  ctx.reply(
    `Bienvenido a AlTramBot, ${ctx.from.first_name}. Este bot te ofrece los horarios de las líneas de tram de Alicante. ¿Desde dónde quieres que te pase los horarios?`,
    Markup
    .keyboard(paradasTeclado)
    .oneTime()
    .resize()
    .extra()
  );
});



const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    console.log(ctx.message.text);
    ctx.wizard.state.origen = ctx.message.text;
		ctx.reply('Y ¿Dónde vas? ', Markup
    .keyboard(paradasTeclado)
    .oneTime()
    .resize()
    .extra()
  );
		
    return ctx.wizard.next();
  },
  ctx => {
    console.log(ctx.message.text + " " + ctx.wizard.state.origen);
    let origen = paradas.find(o => o.nombre === ctx.wizard.state.origen);
    let destino = paradas.find(o => o.nombre === ctx.message.text);
    console.log(origen);
    console.log(destino);
    if (typeof origen !== 'undefined' && typeof destino !== 'undefined'){
      let fecha = new Date();
      var fechaFormateada = moment(fecha).format('DD/MM/YYYY');
      let url = `https://www.tramalicante.es/horarios_pdf.php?origen=${origen.id}&destino=${destino.id}&fecha=${fechaFormateada}&hini=00:00&hfin=23:59`
      ctx.reply('Ahí van los horarios!');
      ctx.reply(url);  
    }
    else{ 
      ctx.reply("Algo ha salido mal, es posible que sea porque no he entendido que paradas me decías. Intenta usar las opciones y no escribir, por favor.")
    }
    return ctx.scene.leave();
  
  }
)

bot.use(Telegraf.log())
const stage = new Stage([superWizard], { default: 'super-wizard' })
bot.use(session())
bot.use(stage.middleware())
bot.startPolling()

expressApp.get('/', (req, res) => {
  res.send('Hello World!');
});
expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});