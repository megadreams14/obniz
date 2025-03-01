/**
 * @packageDocumentation
 * @module Parts.MatrixLED_MAX7219
 */

import Obniz from '../../../obniz';
import PeripheralIO from '../../../obniz/libs/io_peripherals/io';
import PeripheralSPI from '../../../obniz/libs/io_peripherals/spi';
import ObnizPartsInterface, {
  ObnizPartsInfo,
} from '../../../obniz/ObnizPartsInterface';

export interface MatrixLED_MAX7219Options {
  clk: number;
  cs: number;
  din: number;
  gnd?: number;
  vcc?: number;
}

export default class MatrixLED_MAX7219 implements ObnizPartsInterface {
  public static info(): ObnizPartsInfo {
    return {
      name: 'MatrixLED_MAX7219',
    };
  }

  public keys: string[];
  public requiredKeys: string[];
  public cs!: PeripheralIO;
  public params: any;
  public spi!: PeripheralSPI;
  public obniz!: Obniz;
  public width = 0;
  public height = 0;
  public vram: number[][] = [[]];

  constructor() {
    this.keys = ['vcc', 'gnd', 'din', 'cs', 'clk'];
    this.requiredKeys = ['din', 'cs', 'clk'];
  }

  public wired(obniz: Obniz) {
    this.cs = obniz.getIO(this.params.cs);
    // logich high must 3.5v <=
    if (obniz.isValidIO(this.params.vcc)) {
      obniz.getIO(this.params.vcc).output(true);
    }
    if (obniz.isValidIO(this.params.gnd)) {
      obniz.getIO(this.params.gnd).output(false);
    }

    // max 10Mhz but motor driver can't
    this.params.frequency = this.params.frequency || 10 * 1000 * 1000;
    this.params.mode = 'master';
    this.params.mosi = this.params.din;
    this.params.drive = '3v';
    this.spi = this.obniz.getSpiWithConfig(this.params);

    // reset a onece
    this.cs.output(true);
    this.cs.output(false);
    this.cs.output(true);
  }

  public init(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.preparevram(width, height);
    this.initModule();
  }

  public initModule() {
    this.write([0x09, 0x00]); // Code B decode for digits 3-0 No decode for digits 7-4
    this.write([0x0a, 0x05]); // brightness 9/32 0 to f
    this.write([0x0b, 0x07]); // Display digits 0 1 2 3 4 567
    this.write([0x0c, 0x01]); // Shutdown to normal operation
    this.write([0x0f, 0x00]);
    this.passingCommands();
    this.obniz.wait(10);
  }

  public test() {
    this.write([0x0f, 0x00]); // test command
    this.passingCommands();
  }

  public passingCommands() {
    for (let i = 8; i < this.width; i += 8) {
      // this needed for number of unit
      this.write([0x00, 0x00]);
    }
  }

  public brightness(val: number) {
    this.write([0x0a, val]); // 0 to 15;
    this.passingCommands();
  }

  public preparevram(width: number, height: number) {
    this.vram = [];
    for (let i = 0; i < height; i++) {
      const dots: number[] = new Array(width / 8);
      for (let ii = 0; ii < dots.length; ii++) {
        dots[ii] = 0x00;
      }
      this.vram.push(dots);
    }
  }

  public write(data: number[]) {
    this.cs.output(false);
    this.spi.write(data);
    this.cs.output(true);
  }

  public writeVram() {
    for (let line_num = 0; line_num < this.height; line_num++) {
      const addr = line_num + 1;
      const line = this.vram[line_num];
      const data: number[] = [];
      for (let col = 0; col < line.length; col++) {
        data.push(addr);
        data.push(line[col]);
      }
      this.write(data);
    }
  }

  public clear() {
    for (let line_num = 0; line_num < this.height; line_num++) {
      const line = this.vram[line_num];
      for (let col = 0; col < line.length; col++) {
        this.vram[line_num][col] = 0x00;
      }
      this.writeVram();
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const brightness =
        0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      const index = Math.floor(i / 4);
      const line = Math.floor(index / this.width);
      const col = Math.floor((index - line * this.width) / 8);
      const bits = Math.floor(index - line * this.width) % 8;
      if (bits === 0) {
        this.vram[line][col] = 0x00;
      }
      if (brightness > 0x7f) {
        this.vram[line][col] |= 0x80 >> bits;
      }
    }

    this.writeVram();
  }
}
