"use strict";
//Todo: add weight and calc pressure(kg)
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class FSR40X {
    constructor() {
        this.keys = ['pin0', 'pin1'];
        this.requiredKeys = ['pin0', 'pin1'];
    }
    static info() {
        return {
            name: 'FSR40X',
        };
    }
    wired(obniz) {
        this.obniz = obniz;
        this.io_pwr = obniz.getIO(this.params.pin0);
        this.ad = obniz.getAD(this.params.pin1);
        this.io_pwr.drive('5v');
        this.io_pwr.output(true);
        let self = this;
        this.ad.start(function (value) {
            let pressure = value * 100;
            self.press = pressure;
            if (self.onchange) {
                self.onchange(self.press);
            }
        });
    }
    getWait() {
        return __awaiter(this, void 0, void 0, function* () {
            let value = yield this.ad.getWait();
            let pressure = value * 100;
            this.press = pressure;
            return this.press;
        });
    }
}
if (typeof module === 'object') {
    module.exports = FSR40X;
}
