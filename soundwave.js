'use strict';

var player = require('play-sound')();
var apiai = require("apiai");
var fs = require('fs')
const record = require('node-record-lpcm16');
let { Detector, Models } = require('snowboy');
let eos = require('end-of-stream')

var config = require('./config.json');

//player.play('media/asyoucommand.wav', function(err){
//    if (err) throw err
//});

var FILE_BUFFER_PATH = 'command.wav';

var app = apiai(config.API_AI, {
    language: 'it'
});

var options = {
    sessionId: 'soundwave-session'
};



const models = new Models();

models.add({
    file: 'resources/Soundwave.pmdl',
    sensitivity: '0.5',
    hotwords: 'Soundwave'
});



//var t =fs.createWriteStream('command.wav', { encoding: 'binary' })



function recordCommand() {
    let file = fs.createWriteStream(FILE_BUFFER_PATH, { encoding: 'binary' });

    let detector = new Detector({
        resource: "resources/common.res",
        models: models,
        audioGain: 2.0
    });

    let cmd = record.start({
        sampleRateHertz: 16000,
        threshold: 0,
    })

    let command_begun = false,
        time_silence = null,
        time = new Date();

    detector.on('silence', function () {
        if (command_begun && time_silence == null) {
            time_silence = time.getTime()
            console.log('Silent')
        }
        else if (command_begun && time_silence !== null) {
            if (((new Date()).getTime() - time_silence) > 5000) {
                record.stop()
                command_begun = false
            }
            else {
                console.log((new Date()).getTime() + ' minus ' + time_silence)
            }
        }
    })
    detector.on('sound', function () {
        if (command_begun) {
            time_silence = null
        }
        else
            command_begun = true
        console.log('Noise')
    })

    cmd.pipe(detector)
    cmd.pipe(file)

    eos(cmd, function(err) {
        if (err) return console.log('stream had an error or closed early');
        console.log("End of write command");
        sendCommandToAI();

    });

}


function sendCommandToAI() {

    var request = app.voiceRequest(options);
    
    request.on('response', function(response) {
        console.log(response);
    });
    
    request.on('error', function(error) {
        console.log(error);
    });
    
    fs.readFile(FILE_BUFFER_PATH, function(error, buffer) {
        if (error) {
            console.log(error);
        } else {
            request.write(buffer);
        }
    
        request.end();
    });
}



function waitForCommands() {

    let detector = new Detector({
        resource: "resources/common.res",
        models: models,
        audioGain: 2.0
    });

    detector.on('hotword', function (index, hotword, buffer) {
        if (hotword === 'Soundwave') {

            console.log("As you command!")
            recordCommand();
        }

        console.log('hotword', index, hotword);
    });

    const mic = record.start({
        recordProgram: 'arecord',
        threshold: 0,
        verbose: false
    });

    mic.pipe(detector);

}

console.log("** SOUNDWAVE START **");

//waitForCommands();
sendCommandToAI();