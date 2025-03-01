/**
 * @packageDocumentation
 * @ignore
 */
import { BleDeviceAddress, UUID } from './bleTypes';

class BleHelper {
  uuidFilter(uuid: string | UUID): UUID {
    return uuid.toLowerCase().replace(/[^0-9abcdef]/g, '');
  }

  deviceAddressFilter(uuid: string | BleDeviceAddress): BleDeviceAddress {
    return uuid.toLowerCase().replace(/[^0-9abcdef]/g, '') as BleDeviceAddress;
  }

  toCamelCase(str: string): string {
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str.replace(/[-_](.)/g, (match: any, group1: any) => {
      return group1.toUpperCase();
    });
  }

  toSnakeCase(str: string): string {
    const camel: any = this.toCamelCase(str);
    return camel.replace(/[A-Z]/g, (s: any) => {
      return '_' + s.charAt(0).toLowerCase();
    });
  }

  buffer2reversedHex(buf: Buffer, sepalator = ''): string {
    return this.reverseHexString(buf.toString('hex'), sepalator);
  }

  hex2reversedBuffer(address: string, sepalator = ''): Buffer {
    if (sepalator === '') {
      return Buffer.from(this.reverseHexString(address), 'hex');
    }

    return Buffer.from(address.split(':').reverse().join(''), 'hex');
  }

  reverseHexString(str: string, separator = ''): string {
    // 40msec (100000 times)
    // return str
    //   .match(/.{1,2}/g)!
    //   .reverse()
    //   .join(separator);

    // 30msec (100000 times)
    // const parts = [];
    // for (let i = 0; i < str.length; i += 2) {
    //   parts.push(str.slice(i, i + 2));
    // }
    // return parts.reverse().join(separator);

    // 13msec (100000 times)
    let result = '';
    const len = str.length + (str.length % 2);
    for (let i = len; i > 0; i -= 2) {
      result += str.slice(i - 2, i) + separator;
    }
    if (separator.length !== 0) {
      return result.slice(0, -1 * separator.length);
    }
    return result;
  }
}

export default new BleHelper();
