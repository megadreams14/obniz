/**
 * @packageDocumentation
 * @module Parts.TR7
 */
/* eslint rulesdir/non-ascii: 0 */

import BleRemotePeripheral from '../../../obniz/libs/embeds/bleHci/bleRemotePeripheral';
import ObnizPartsBleInterface, {
  ObnizPartsBleInfo,
} from '../../../obniz/ObnizPartsBleInterface';
import { BleAdvBinaryAnalyzer } from '../utils/advertisement/advertismentAnalyzer';

export interface TR7Options {}

export interface TR7Data {
  temperature: number;
  humidity: number;
}
/**
 * Class that manages TR7 series.
 *
 * TR7シリーズを管理するクラス。
 */
export default class TR7 implements ObnizPartsBleInterface {
  public _peripheral: BleRemotePeripheral | null = null;

  public static info(): ObnizPartsBleInfo {
    return {
      name: 'TR7',
    };
  }

  /**
   * Verify that the received peripheral is from the TR7.
   *
   * 受け取ったPeripheralがTR7シリーズのものかどうかを確認する。
   *
   * @param peripheral Instance of BleRemotePeripheral. BleRemotePeripheralのインスタンス。
   *
   * @returns Whether it is the TR7 or not. TR7かどうか。
   *
   */
  public static isDevice(peripheral: BleRemotePeripheral): boolean {
    return this._deviceAdvAnalyzer.validate(peripheral.adv_data);
  }

  /**
   * Get data from TR7 series.
   *
   * T7シリーズからデータを取得。
   *
   * @param peripheral Instance of BleRemotePeripheral. BleRemotePeripheralのインスタンス。
   *
   * @returns Data recieved from TR7. TR7から受け取ったデータ。
   *
   * ```
   * {
   *    temperature: temperature 温度 (Unit: 0.1 degC)
   *    humidity: humidity 湿度 (Unit: 0.1 %)
   * }
   * ```
   */
  public static getData(peripheral: BleRemotePeripheral): TR7Data | null {
    if (!this.isDevice(peripheral)) return null;

    const temperatureBytes = this._deviceAdvAnalyzer.getData(
      peripheral.adv_data,
      'manufacture',
      'measuredDataCh1'
    );
    const humidityBytes = this._deviceAdvAnalyzer.getData(
      peripheral.adv_data,
      'manufacture',
      'measuredDataCh2'
    );
    if (!temperatureBytes || !humidityBytes) return null;

    const rawTemperature =
      temperatureBytes === [0xee, 0xee] // error
        ? null
        : Buffer.from(temperatureBytes).readInt16LE(0);

    const rawHumidity =
      humidityBytes === [0xee, 0xee] // error
        ? null
        : Buffer.from(humidityBytes).readInt16LE(0);

    if (!rawTemperature || !rawHumidity) return null;

    return {
      temperature: (rawTemperature - 1000) / 10, // NOTE: Document says we have to do this mathmatics.
      humidity: (rawHumidity - 1000) / 10, // NOTE: Document says we have to do this mathmatics.
    };
  }

  private static _deviceAdvAnalyzer = new BleAdvBinaryAnalyzer()
    .addTarget('flags', [0x02, 0x01, 0x06]) // NOTE: length, ad type, ad data
    .addTarget('32bitServiceUuids', [0x05, 0x05, 0x0a, 0x18, 0x00, 0x00]) // NOTE: little endian

    .groupStart('manufacture')
    .addTarget('length', [0x15])
    .addTarget('type', [0xff])
    .addTarget('companyId', [0x92, 0x03]) // NOTE: little endian
    .addTargetByLength('deviceSerial', 4)
    .addTargetByLength('controlCode', 1)
    .addTargetByLength('counter', 1)
    .addTargetByLength('statusCode1', 1)
    .addTargetByLength('statusCode2', 1)
    .addTargetByLength('measuredDataCh1', 2)
    .addTargetByLength('measuredDataCh2', 2)
    .addTargetByLength('spare', 4)
    .addTargetByLength('unused', 2)
    .groupEnd();
}
