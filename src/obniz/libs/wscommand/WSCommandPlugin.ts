/**
 * @packageDocumentation
 * @ignore
 */
import WSCommand from './WSCommand';

class WSCommandPlugin extends WSCommand {
  public module: number;
  public _CommandReceive: number; // js <- device
  public _CommandSend: number; // js -> device

  constructor() {
    super();
    this.module = 15;

    this._CommandSend = 0;
    this._CommandReceive = 1;
  }

  public send(params: any, index: any) {
    const buf = new Uint8Array(params.send);
    this.sendCommand(this._CommandSend, buf);
  }

  public parseFromJson(json: any) {
    const module = json.plugin;
    if (module === undefined) {
      return;
    }

    const schemaData = [{ uri: '/request/plugin/send', onValid: this.send }];
    const res = this.validateCommandSchema(schemaData, module, 'plugin');

    if (res.valid === 0) {
      if (res.invalidButLike.length > 0) {
        throw new Error(res.invalidButLike[0].message);
      } else {
        throw new this.WSCommandNotFoundError(`[network]unknown command`);
      }
    }
  }

  public notifyFromBinary(objToSend: any, func: number, payload: Uint8Array) {
    switch (func) {
      case this._CommandReceive: {
        // convert buffer to array
        const arr = new Array(payload.byteLength);
        for (let i = 0; i < arr.length; i++) {
          arr[i] = payload[i];
        }

        objToSend.plugin = {
          receive: arr,
        };
        break;
      }
    }
  }
}

export default WSCommandPlugin;
