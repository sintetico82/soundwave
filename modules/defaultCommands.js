'use strict';
const say = require('say')
var config = require('../config.json');
const voice = config.VOICE || '';

module.exports = Commands;

function Commands(name) {

    this.name = name;
}

Commands.prototype.execute = function() {
    return this[this.name] && this[this.name].apply(this, [].slice.call(arguments, 1));
}


Commands.prototype.time_get = function() {
    var date = new Date();
    var hour = date.getHours();
    var min  = date.getMinutes();
    say.speak('Sono le ore ' + hour + ' e '+min+' minuti.',voice);
}