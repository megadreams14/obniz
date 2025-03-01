/**
 * @packageDocumentation
 * @module ObnizCore.Components
 */

import semver from 'semver';
import Obniz from '../../index';
import { ComponentAbstract } from '../ComponentAbstact';

/**
 * @param TCPReceiveCallbackFunction.data
 * received data
 */
type TCPReceiveCallbackFunction = (data: number[]) => void;

/**
 * @param TCPConnectionCallbackFunction.connected
 * - True : Connect
 * - False : Disconnect
 */
type TCPConnectionCallbackFunction = (connected: boolean) => void;

/**
 *
 * @param TCPErrorCallbackFunction.error
 * Error object
 */
type TCPErrorCallbackFunction = (error: any) => void;

/**
 * Create a TCP connection from a device throught the network the device is currently connected to.
 *
 * @category Protocol
 */
export default class Tcp extends ComponentAbstract {
  /**
   * Callback function is called when there is a change in TCP connection status.
   *
   * ```
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   *
   * tcp.onconnection = data => {
   *  console.log(data);
   * };
   * tcp.connectWait(80,"obniz.io");
   * ```
   */
  public onconnection?: TCPConnectionCallbackFunction;

  /**
   * Callback function is called when TCP is received.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.connectWait(80,"obniz.io");
   *
   * tcp.onreceive = data => {
   *   console.log(data);
   * };
   * ```
   *
   */
  public onreceive?: TCPReceiveCallbackFunction;

  /**
   * You can get the error message that occurred when connecting.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.connectWait(80,"obniz.io");
   *
   * tcp.onerror = state => {
   *   console.log(state);
   * };
   * ```
   */
  public onerror?: TCPErrorCallbackFunction;
  private id: number;
  private connectObservers: any;
  private readObservers!: TCPReceiveCallbackFunction[];
  private used!: boolean;

  constructor(obniz: Obniz, id: number) {
    super(obniz);
    this.id = id;

    this.on('/response/tcp/connection', (obj) => {
      /* Connectino state update. response of connect(), close from destination, response from */
      this.Obniz._runUserCreatedFunction(
        this.onconnection,
        obj.connection.connected
      );
      if (!obj.connection.connected) {
        this._reset();
      }
    });
    this.on('/response/tcp/read', (obj) => {
      this.Obniz._runUserCreatedFunction(this.onreceive, obj.read.data);
      const callback = this.readObservers.shift();
      if (callback) {
        callback(obj.read.data);
      }
    });
    this.on('/response/tcp/connect', (obj) => {
      /* response of connect() */
      /* `this.connection` will called before this function */
      if (obj.connect.code !== 0) {
        this.Obniz._runUserCreatedFunction(this.onerror, obj.connect);
      }
      const callback = this.connectObservers.shift();
      if (callback) {
        callback(obj.connect.code);
      }
    });

    this._reset();
  }

  /**
   * Starts a connection on the port and domain for which TCP is specified.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.connectWait(80,"obniz.io");
   * ```
   *
   * @param port
   * @param domain
   */
  public connectWait(port: number, domain: string): Promise<void> {
    if (semver.lt(this.Obniz.firmware_ver!, '2.1.0')) {
      throw new Error(`Please update obniz firmware >= 2.1.0`);
    }

    // TODO
    // if (this.used) {
    //   throw new Error(`tcp${this.id} is in used`);
    // }

    if (port < 0 || port > 65535) {
      throw new Error(`tcp${this.id} is invalid port`);
    }
    if (domain.length > 30) {
      throw new Error(`tcp${this.id} is domain length over`);
    }

    this.connectObservers = [];
    this.used = true;
    return new Promise((resolve: any, reject: any) => {
      this._addConnectObserver(resolve);
      const obj: any = {};
      obj['tcp' + this.id] = {
        connect: {
          port,
          domain,
        },
      };
      this.Obniz.send(obj);
    });
  }

  /**
   * The argument data is sent by TCP.
   *
   * If you pass a string or Array type argument, the data will be sent.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.connectWait(80,"obniz.io");
   *
   * // Array
   * tcp.write([0,1,2,3,4]);
   *
   * // Text
   * tcp.write('hello');
   * ```
   *
   * @param data
   */
  public write(data: number | number[] | Buffer | string) {
    if (!this.used) {
      throw new Error(`tcp${this.id} is not started`);
    }
    if (data === undefined) {
      return;
    }
    if (typeof data === 'number') {
      data = [data];
    }

    let send_data = null;
    if (this.Obniz.isNode && data instanceof Buffer) {
      send_data = [...data];
    } else if (data.constructor === Array) {
      send_data = data;
    } else if (typeof data === 'string') {
      const buf = Buffer.from(data);
      send_data = [...buf];
    }
    const obj: any = {};
    obj['tcp' + this.id] = {
      write: {
        data: send_data,
      },
    };
    this.Obniz.send(obj);
  }

  /**
   * Wait for TCP reception.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.connectWait(80,"obniz.io");
   *
   * let data = await tcp.readWait();
   * console.log(data);
   * ```
   */
  public readWait(): Promise<number[]> {
    if (!this.used) {
      throw new Error(`tcp${this.id} is not started`);
    }
    return new Promise((resolve: any, reject: any) => {
      this._addReadObserver(resolve);
    });
  }

  /**
   * Terminates the TCP session.
   *
   * ```javascript
   * // Javascript Example
   * var tcp = obniz.getFreeTcp();
   * tcp.end();
   * ```
   */
  public end() {
    this.close();
  }

  /**
   * @ignore
   */
  public isUsed() {
    return this.used;
  }

  public schemaBasePath(): string {
    return 'tcp' + this.id;
  }

  /**
   * @ignore
   * @private
   */
  protected _reset() {
    this.connectObservers = [];
    this.readObservers = [];
    this.used = false;
  }

  private close() {
    if (!this.used) {
      throw new Error(`tcp${this.id} is not used`);
    }
    const obj: any = {};
    obj['tcp' + this.id] = {
      disconnect: true,
    };
    this.Obniz.send(obj);
  }

  private _addConnectObserver(callback: any) {
    if (callback) {
      this.connectObservers.push(callback);
    }
  }

  private _addReadObserver(callback: TCPReceiveCallbackFunction) {
    if (callback) {
      this.readObservers.push(callback);
    }
  }
}
