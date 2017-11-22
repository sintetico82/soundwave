'use strict';


var record = require('node-record-lpcm16');
var player = require('play-sound')();
var request = require('request');
let { Detector, Models } = require('snowboy');
var config = require('./config.json');
var emitter = require('./emitter.js');

const state = require('./modules/async-finite-state-machine');
var Command = require('./modules/defaultCommands.js');

var LightUpMyLove = require('./lightUpMyLove.js');
var lightUpMyLove = new LightUpMyLove();

module.exports = SoundwaveBrain;

function firstEntity(entities, name) {
    return entities &&
        entities[name] &&
        Array.isArray(entities[name]) &&
        entities[name] &&
        entities[name][0];
}

function SoundwaveBrain(name) {
    this.lastCommand = '';
    this.name = name;
    this.fsm = state(); // Finite state machine

    this.models = new Models();

    this.models.add({
        file: 'resources/Soundwave.pmdl',
        sensitivity: '0.5',
        hotwords: 'Soundwave'
    });

    process.on('SIGINT', function () {
        console.log("Exit program");
        lightUpMyLove.off();
    });

    this.fsm.addState('LISTENING', this.waitForCommands());
    this.fsm.addState('RECORDING', this.trasmitCommand(), this.executeCommand);

    this.fsm.setState('LISTENING')
}

SoundwaveBrain.prototype.asYouCommand = function () {
    lightUpMyLove.wait();
    player.play('media/asyoucommand.wav', function (err) {
        if (err) throw err
    });
}

SoundwaveBrain.prototype.trasmitCommand = function (callback) {

    var mainBlock = this;

    function logCallback(err, resp, body) {
        console.log(body)
        if (callback !== undefined)
            callback(err, resp, body);
    }


    let enter = async function() {

    let detector = new Detector({
        resource: "resources/common.res",
        models: mainBlock.models,
        audioGain: 2.0
    });

    let command_begun = false,
        time_silence = null,
        time = new Date();

    detector.on('silence', function () {
        if (command_begun && time_silence == null) {
            time_silence = time.getTime()
            console.log('Silent')
        }
        else if (command_begun && time_silence !== null) {
            if (((new Date()).getTime() - time_silence) > 2500) {
                
                record.stop()
                mainBlock.fsm.setState('LISTENING');
                
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


    const mic = record.start({
        recordProgram: 'arecord',
        threshold: 0,
        verbose: true
    });

    mic.pipe(detector);
    mic.pipe(request.post({
        'url': 'https://api.wit.ai/speech?v=20170307',
        'headers': {
            'Accept': 'application/vnd.wit.20160202+json',
            'Authorization': 'Bearer ' + config.WIT_AI,
            'Content-Type': 'audio/wav',
            "cache-control": "no-cache",
        }
    }, logCallback))

    }

    return Object.freeze({enter});
   
}

SoundwaveBrain.prototype.waitForCommands = function () {
    var mainBlock = this;

    let enter = async function () {

        let detector = new Detector({
            resource: "resources/common.res",
            models: mainBlock.models,
            audioGain: 2.0
        });

        detector.on('hotword', function (index, hotword, buffer) {
            if (hotword === 'Soundwave') {
                lightUpMyLove.on();
                console.log("As you command!")
                emitter.eventBus.sendEvent('as_you_command'); // Send ready for command event
                //mainBlock.trasmitCommand(mainBlock.executeCommand);

                record.stop();
                mainBlock.fsm.setState('RECORDING');
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

    return Object.freeze({ enter });

}

SoundwaveBrain.prototype.executeCommand = function (err, resp, body) {
    if (resp.statusCode === 200) {
        const intent = firstEntity(JSON.parse(body).entities, 'intent');
        console.log(intent);


        let command = new Command(typeof intent !== 'undefined' && intent ? intent.value : "not_understand");
        command.execute();


    }

}

