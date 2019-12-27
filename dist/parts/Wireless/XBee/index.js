"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class XBee {
    constructor() {
        this.keys = ['tx', 'rx', 'gnd'];
        this.requiredKeys = ['tx', 'rx'];
        this.displayIoNames = { tx: '<tx', rx: '>rx' };
    }
    static info() {
        return {
            name: 'XBee',
        };
    }
    wired(obniz) {
        this.uart = obniz.getFreeUart();
        this.currentCommand = null;
        this.commands = [];
        this.isAtMode = false;
        this.onFinishAtModeCallback = null;
        if (typeof this.params.gnd === 'number') {
            obniz.getIO(this.params.gnd).output(false);
        }
        this.uart.start({
            tx: this.params.tx,
            rx: this.params.rx,
            baud: 9600,
            drive: '3v',
        });
        this.uart.onreceive = function (data, text) {
            if (this.isAtMode) {
                this.onAtResultsRecieve(data, text);
            }
            else {
                if (typeof this.onreceive === 'function') {
                    this.onreceive(data, text);
                }
            }
        }.bind(this);
    }
    send(text) {
        if (this.isAtMode === false) {
            this.uart.send(text);
        }
        else {
            this.obniz.error('XBee is AT Command mode now. Wait for finish config.');
        }
    }
    onAtResultsRecieve(data, text) {
        if (!this.isAtMode) {
            return;
        }
        let next = function () {
            this.currentCommand = null;
            this.sendCommand();
        }.bind(this);
        if (text === 'OK\r') {
            if (this.currentCommand === 'ATCN') {
                this.isAtMode = false;
                this.currentCommand = null;
                if (typeof this.onFinishAtModeCallback === 'function') {
                    this.onFinishAtModeCallback();
                    this.onFinishAtModeCallback = null;
                }
                return;
            }
            next();
        }
        else if (text === 'ERROR\r') {
            this.obniz.error('XBee config error : ' + this.currentCommand);
        }
        else {
            //response of at command.
            console.log('XBEE : no catch message', data);
            next();
        }
    }
    addCommand(command, value) {
        let str = command + (value ? ' ' + value : '');
        this.commands.push(str);
        if (this.isAtMode === true && this.currentCommand === null) {
            this.sendCommand();
        }
    }
    sendCommand() {
        if (this.isAtMode === true &&
            this.currentCommand === null &&
            this.commands.length > 0) {
            this.currentCommand = 'AT' + this.commands.shift();
            this.uart.send(this.currentCommand + '\r');
        }
    }
    enterAtMode() {
        if (this.currentCommand !== null)
            return;
        this.isAtMode = true;
        this.obniz.wait(1000);
        let command = '+++';
        this.currentCommand = command;
        this.uart.send(this.currentCommand);
        this.obniz.wait(1000);
    }
    exitAtMode() {
        this.addCommand('CN');
    }
    configWait(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isAtMode) {
                throw new Error('Xbee : duplicate config setting');
            }
            return new Promise(function (resolve, reject) {
                let standaloneKeys = {
                    destination_address_high: 'DH',
                    destination_address_low: 'DL',
                    source_address: 'MY',
                };
                let highLowKeys = ['destination_address'];
                this.enterAtMode();
                for (let key in config) {
                    if (key.length === 2) {
                        this.addCommand(key, config[key]);
                    }
                    else if (standaloneKeys[key]) {
                        this.addCommand(standaloneKeys[key], config[key]);
                    }
                    else if (highLowKeys.includes(key)) {
                        let high = config[key].slice(0, -8);
                        if (!high) {
                            high = '0';
                        }
                        let low = config[key].slice(-8);
                        this.addCommand(standaloneKeys[key + '_high'], high);
                        this.addCommand(standaloneKeys[key + '_low'], low);
                    }
                }
                this.exitAtMode();
                this.onFinishAtModeCallback = function () {
                    resolve();
                };
            }.bind(this));
        });
    }
}
if (typeof module === 'object') {
    module.exports = XBee;
}
