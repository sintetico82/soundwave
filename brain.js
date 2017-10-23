'use strict';

var record = require('node-record-lpcm16')
var player = require('play-sound')();
var request = require('request')
let { Detector, Models } = require('snowboy');
var config = require('./config.json');

module.exports = SoundwaveBrain;

function SoundwaveBrain(name) {
    this.name = name;

    this.models = new Models();

    this.models.add({
        file: 'resources/Soundwave.pmdl',
        sensitivity: '0.5',
        hotwords: 'Soundwave'
    });
}

SoundwaveBrain.prototype.asYouCommand = function () {
    player.play('media/asyoucommand.wav', function (err) {
        if (err) throw err
    });
}

SoundwaveBrain.prototype.trasmitCommand = function (callback) {
    var mainBlock = this;
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
        verbose: false
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

    function logCallback(err, resp, body) {
        console.log(body)
        if (callback !== undefined)
            callback(err, resp, body);
    }
}

SoundwaveBrain.prototype.waitForCommands = function () {
    var mainBlock = this;

    let detector = new Detector({
        resource: "resources/common.res",
        models: mainBlock.models,
        audioGain: 2.0
    });

    detector.on('hotword', function (index, hotword, buffer) {
        if (hotword === 'Soundwave') {

            console.log("As you command!")
            mainBlock.trasmitCommand(function () { });
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
