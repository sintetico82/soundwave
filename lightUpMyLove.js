var Gpio = require('onoff').Gpio;
var led14 = new Gpio(14, 'out');
var led15 = new Gpio(15, 'out');
var led18 = new Gpio(18, 'out');

module.exports = LightUpMyLove;

function LightUpMyLove() {

}

LightUpMyLove.prototype.off = function() {
    led14.writeSync(0);
    led15.writeSync(0);
    led18.writeSync(0);
}

LightUpMyLove.prototype.wait = function() {
     led14.writeSync(0);
     led15.writeSync(1);
     led18.writeSync(0);
}

LightUpMyLove.prototype.on = function() {
    led14.writeSync(1);
    led15.writeSync(0);
    led18.writeSync(0);
}

