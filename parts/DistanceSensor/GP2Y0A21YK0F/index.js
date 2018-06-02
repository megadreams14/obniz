class GP2Y0A21YK0F {
  constructor() {
    this.keys = ['vcc', 'gnd', 'signal'];
    this.requiredKeys = ['signal'];

    this.displayIoNames = {
      vcc: 'vcc',
      gnd: 'gnd',
      signal: 'signal',
    };
    this._unit = 'mm';
  }

  wired(obniz) {
    this.obniz = obniz;

    obniz.setVccGnd(this.params.vcc, this.params.gnd, '5v');
    this.io_signal = obniz.getIO(this.params.signal);
    this.io_signal.end();
    this.ad_signal = obniz.getAD(this.params.signal);
  }

  start(callback) {
    this.ad_signal.start(val => {
      if (val <= 0) {
        val = 0.001;
      }
      let distance = 19988.34 * Math.pow(val / 5.0 * 1024, -1.25214) * 10;
      if (this._unit === 'mm') {
        distance = parseInt(distance * 10) / 10;
      } else {
        distance *= 0.0393701;
        distance = parseInt(distance * 1000) / 1000;
      }

      if (typeof callback == 'function') {
        callback(distance);
      }
    });
  }

  unit(unit) {
    if (unit === 'mm') {
      this._unit = 'mm';
    } else if (unit === 'inch') {
      this._unit = 'inch';
    } else {
      throw new Error('unknown unit ' + unit);
    }
  }
}

let Obniz = require('../../../obniz/index.js');
Obniz.PartsRegistrate('GP2Y0A21YK0F', GP2Y0A21YK0F);