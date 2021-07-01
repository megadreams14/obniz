/**
 * @packageDocumentation
 * @module Parts.iBS03T
 */

import { ObnizBleBeaconStruct } from '../../../obniz/ObnizPartsBleAbstract';
import { BaseiBS } from '../utils/abstracts/iBS';

export interface iBS03TOptions {}

export interface iBS03T_Data {
  battery: number;
  button: boolean;
  moving: boolean;
  hall_sensor: boolean;
  temperature: number;
}

export default class iBS03T extends BaseiBS<iBS03T_Data> {
  public static readonly PartsName = 'iBS03T';

  public static readonly BeaconDataStruct: ObnizBleBeaconStruct<iBS03T_Data> = {
    battery: BaseiBS.Config.battery,
    button: BaseiBS.Config.button,
    moving: BaseiBS.Config.moving,
    hall_sensor: BaseiBS.Config.event,
    temperature: BaseiBS.Config.temperature,
    ...BaseiBS.getUniqueData(3, 0x15),
  };

  protected readonly staticClass = iBS03T;
}
