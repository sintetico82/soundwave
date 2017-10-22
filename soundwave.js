'use strict';

var player = require('play-sound')();
var apiai = require("apiai");
var fs = require('fs')
const record = require('node-record-lpcm16');
let {Detector, Models} = require('snowboy');

//player.play('media/asyoucommand.wav', function(err){
//    if (err) throw err
//});

var ACCESS_TOKEN = "cef1797ea3344fba97f4ca376e7ea65b";
var FILE_BUFFER_PATH = 'command.wav';

var app = apiai(ACCESS_TOKEN, {
    language: 'it'
});

var options = {
    sessionId: 'soundwave-session'
};





const models = new Models(); 

models.add({
    file: 'resources/Soundwave.pmdl',
    sensitivity: '0.5',
    hotwords : 'Soundwave'
});

const detector = new Detector({
    resource: "resources/common.res",
    models: models,
    audioGain: 2.0
});

var t =fs.createWriteStream('command.wav', { encoding: 'binary' })

detector.on('hotword', function (index, hotword,buffer) {
    if(hotword === 'Soundwave') {
      console.log("As you command!")


     /* let file = fs.createWriteStream('command.wav', { encoding: 'binary' })
      let mic2 = record.start({
        threshold: 0.9,
        silence: '1.0',
        recordProgram: 'arecord',
        sampleRateHertz: 16000,
        verbose: true
      });
      mic2.pipe(file);
      mic2.addListener("end",function(e) {
        console.log(e);
      });*/

      /*setTimeout(function () {
        mic2.stop()
      }, 3000)*/

      var request = app.voiceRequest(options);
      //var request = app.textRequest('Esci dal programma',options);
      
      request.on('response', function(response) {
          console.log(response);
      });
      
      request.on('error', function(error) {
          console.log(error);
      });
      
    }

    console.log('hotword', index, hotword);
  });
 
  detector.on('sound', function (buffer) {
    // <buffer> contains the last chunk of the audio that triggers the "sound"
    // event. It could be written to a wav stream.
    console.log(buffer.length);
    console.log('sound');

  });



const mic = record.start({
    recordProgram: 'arecord',
    threshold: 0,
    verbose: false
});

mic.pipe(detector);


console.log("** SOUNDWAVE START **");