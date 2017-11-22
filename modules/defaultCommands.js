'use strict';
const EventEmitter = require('events');
const say = require('say')
var config = require('../config.json');
const voice = config.VOICE || '';

var lame = require('lame');
var icecast = require('icy');
var Speaker = require('speaker');

var emitter = require('../emitter.js')


module.exports = Commands;

function Commands(name) {

    this.name = name;
    this.radio = {};
}

Commands.prototype.execute = function() {
    return this[this.name] && this[this.name].apply(this, [].slice.call(arguments, 1));
}

Commands.prototype.not_understand = function() {
    say.speak('Non ho capito',voice);
}


Commands.prototype.time_get = function() {
    var date = new Date();
    var hour = date.getHours();
    var min  = date.getMinutes();
    say.speak('Sono le ore ' + hour + ' e '+min+' minuti.',voice);
}

Commands.prototype.radio_play = function() {
    say.speak('Acoltiamo un po di musica!');
    var mainBlock = this;
    this.radio = icecast.get(config.RADIO[0].URL, function (res) {
        
         // log the HTTP response headers 
         console.error(res.headers);
        
         // log any "metadata" events that happen 
         res.on('metadata', function (metadata) {
           var parsed = icecast.parse(metadata);
           console.error(parsed);
         });
        
         // Let's play the music (assuming MP3 data). 
         // lame decodes and Speaker sends to speakers! 
         res.pipe(new lame.Decoder())
            .pipe(new Speaker());
       });
    
    emitter.eventBus.on('as_you_command', function(data) {
        console.log("Try pause the radio...")
        mainBlock.radio.destroy();
    })
}

Commands.prototype.radio_stop = function() { 
    this.radio.destroy();
}

