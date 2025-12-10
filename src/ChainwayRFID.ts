import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';

interface ChainwayRfidInterface {
  // Constants
  BANK_RESERVED: number;
  BANK_EPC: number;
  BANK_TID: number;
  BANK_USER: number;

  FREQ_CHINA_840: number;
  FREQ_CHINA_920: number;
  FREQ_EUROPE: number;
  FREQ_USA: number;
  FREQ_KOREA: number;
  FREQ_JAPAN: number;

  EVENT_TAG_READ: string;
  EVENT_INVENTORY_START: string;
  EVENT_INVENTORY_STOP: string;

  // Methods
  init(): Promise<boolean>;
  free(): Promise<boolean>;
  getVersion(): Promise<string>;
  setPower(power: number): Promise<boolean>;
  getPower(): Promise<number>;
  setFrequencyMode(mode: number): Promise<boolean>;
  getFrequencyMode(): Promise<number>;
  startInventory(): Promise<boolean>;
  stopInventory(): Promise<boolean>;
  inventorySingleTag(): Promise<TagInfo>;
  readData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
  ): Promise<string>;
  writeData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
  ): Promise<boolean>;
  writeEPC(accessPwd: string, epcData: string): Promise<boolean>;
  setFilter(
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
  ): Promise<boolean>;
  lockTag(accessPwd: string, lockCode: string): Promise<boolean>;
  killTag(killPwd: string): Promise<boolean>;
  isInventorying(): Promise<boolean>;
  setEPCMode(): Promise<boolean>;
  setEPCAndTIDMode(): Promise<boolean>;
}

export interface TagInfo {
  epc: string;
  tid: string;
  user: string;
  rssi: string;
  count: string;
}

export type TagReadCallback = (tag: TagInfo) => void;
export type InventoryStatusCallback = () => void;

const { ChainwayRfid } = NativeModules;

if (!ChainwayRfid) {
  throw new Error('ChainwayRfid native module is not available');
}

const RfidModule = ChainwayRfid as ChainwayRfidInterface;
const eventEmitter = new NativeEventEmitter(ChainwayRfid);

/**
 * Chainway C5 RFID Reader Module
 *
 * This module provides access to the Chainway C5 UHF RFID reader functionality.
 *
 * @example
 * ```typescript
 * import ChainwayRFID from './ChainwayRFID';
 *
 * // Initialize the reader
 * const initialized = await ChainwayRFID.init();
 *
 * // Set power level (0-30)
 * await ChainwayRFID.setPower(26);
 *
 * // Listen for tags
 * ChainwayRFID.addTagReadListener((tag) => {
 *   console.log('Tag read:', tag.epc, 'RSSI:', tag.rssi);
 * });
 *
 * // Start reading tags
 * await ChainwayRFID.startInventory();
 *
 * // Stop reading
 * await ChainwayRFID.stopInventory();
 *
 * // Clean up
 * ChainwayRFID.removeAllListeners();
 * await ChainwayRFID.free();
 * ```
 */
class ChainwayRFID {
  // Memory Bank Constants
  static readonly BANK_RESERVED = RfidModule.BANK_RESERVED;
  static readonly BANK_EPC = RfidModule.BANK_EPC;
  static readonly BANK_TID = RfidModule.BANK_TID;
  static readonly BANK_USER = RfidModule.BANK_USER;

  // Frequency Mode Constants
  static readonly FREQ_CHINA_840 = RfidModule.FREQ_CHINA_840;
  static readonly FREQ_CHINA_920 = RfidModule.FREQ_CHINA_920;
  static readonly FREQ_EUROPE = RfidModule.FREQ_EUROPE;
  static readonly FREQ_USA = RfidModule.FREQ_USA;
  static readonly FREQ_KOREA = RfidModule.FREQ_KOREA;
  static readonly FREQ_JAPAN = RfidModule.FREQ_JAPAN;

  // Event Names
  static readonly EVENT_TAG_READ = RfidModule.EVENT_TAG_READ;
  static readonly EVENT_INVENTORY_START = RfidModule.EVENT_INVENTORY_START;
  static readonly EVENT_INVENTORY_STOP = RfidModule.EVENT_INVENTORY_STOP;

  /**
   * Initialize the RFID reader
   * @returns Promise that resolves to true if initialization was successful
   */
  static init(): Promise<boolean> {
    return RfidModule.init();
  }

  /**
   * Free/disconnect the RFID reader
   * @returns Promise that resolves to true if successful
   */
  static free(): Promise<boolean> {
    return RfidModule.free();
  }

  /**
   * Get the RFID module version
   * @returns Promise that resolves to version string
   */
  static getVersion(): Promise<string> {
    return RfidModule.getVersion();
  }

  /**
   * Set the transmit power level
   * @param power Power level (0-30)
   * @returns Promise that resolves to true if successful
   */
  static setPower(power: number): Promise<boolean> {
    if (power < 0 || power > 30) {
      return Promise.reject(new Error('Power must be between 0 and 30'));
    }
    return RfidModule.setPower(power);
  }

  /**
   * Get the current power level
   * @returns Promise that resolves to power level (0-30)
   */
  static getPower(): Promise<number> {
    return RfidModule.getPower();
  }

  /**
   * Set the frequency mode/region
   * @param mode Frequency mode (use FREQ_* constants)
   * @returns Promise that resolves to true if successful
   */
  static setFrequencyMode(mode: number): Promise<boolean> {
    return RfidModule.setFrequencyMode(mode);
  }

  /**
   * Get the current frequency mode
   * @returns Promise that resolves to frequency mode
   */
  static getFrequencyMode(): Promise<number> {
    return RfidModule.getFrequencyMode();
  }

  /**
   * Start continuous tag inventory/reading
   * Tags will be reported via the tag read listener
   * @returns Promise that resolves to true if successful
   */
  static startInventory(): Promise<boolean> {
    return RfidModule.startInventory();
  }

  /**
   * Stop continuous tag inventory
   * @returns Promise that resolves to true if successful
   */
  static stopInventory(): Promise<boolean> {
    return RfidModule.stopInventory();
  }

  /**
   * Read a single tag (one-time read, not continuous)
   * @returns Promise that resolves to tag information
   */
  static inventorySingleTag(): Promise<TagInfo> {
    return RfidModule.inventorySingleTag();
  }

  /**
   * Read data from a tag's memory
   * @param accessPwd Access password (4 bytes hex, e.g., "00000000")
   * @param bank Memory bank (use BANK_* constants)
   * @param ptr Start address in words
   * @param cnt Number of words to read
   * @returns Promise that resolves to hex string data
   */
  static readData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
  ): Promise<string> {
    return RfidModule.readData(accessPwd, bank, ptr, cnt);
  }

  /**
   * Write data to a tag's memory
   * @param accessPwd Access password (4 bytes hex, e.g., "00000000")
   * @param bank Memory bank (use BANK_* constants)
   * @param ptr Start address in words
   * @param cnt Number of words to write
   * @param data Hex string data to write
   * @returns Promise that resolves to true if successful
   */
  static writeData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
  ): Promise<boolean> {
    return RfidModule.writeData(accessPwd, bank, ptr, cnt, data);
  }

  /**
   * Write EPC data to a tag
   * @param accessPwd Access password (4 bytes hex, e.g., "00000000")
   * @param epcData EPC data to write (hex string)
   * @returns Promise that resolves to true if successful
   */
  static writeEPC(accessPwd: string, epcData: string): Promise<boolean> {
    return RfidModule.writeEPC(accessPwd, epcData);
  }

  /**
   * Set a filter for inventory operations
   * Only tags matching the filter will be read
   * @param bank Memory bank to filter on (use BANK_* constants)
   * @param ptr Start address in bits
   * @param cnt Length in bits (0 to disable filter)
   * @param data Filter data (hex string)
   * @returns Promise that resolves to true if successful
   */
  static setFilter(
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
  ): Promise<boolean> {
    return RfidModule.setFilter(bank, ptr, cnt, data);
  }

  /**
   * Lock tag memory regions
   * @param accessPwd Access password (4 bytes hex)
   * @param lockCode Lock code (generated separately)
   * @returns Promise that resolves to true if successful
   */
  static lockTag(accessPwd: string, lockCode: string): Promise<boolean> {
    return RfidModule.lockTag(accessPwd, lockCode);
  }

  /**
   * Kill/destroy a tag (irreversible!)
   * @param killPwd Kill password (4 bytes hex)
   * @returns Promise that resolves to true if successful
   */
  static killTag(killPwd: string): Promise<boolean> {
    return RfidModule.killTag(killPwd);
  }

  /**
   * Check if inventory is currently running
   * @returns Promise that resolves to true if inventory is active
   */
  static isInventorying(): Promise<boolean> {
    return RfidModule.isInventorying();
  }

  /**
   * Set inventory mode to read only EPC
   * Call before starting inventory
   * @returns Promise that resolves to true if successful
   */
  static setEPCMode(): Promise<boolean> {
    return RfidModule.setEPCMode();
  }

  /**
   * Set inventory mode to read EPC and TID
   * Call before starting inventory
   * @returns Promise that resolves to true if successful
   */
  static setEPCAndTIDMode(): Promise<boolean> {
    return RfidModule.setEPCAndTIDMode();
  }

  /**
   * Add a listener for tag read events
   * @param callback Function to call when a tag is read
   * @returns Subscription object (call .remove() to unsubscribe)
   */
  static addTagReadListener(callback: TagReadCallback): EmitterSubscription {
    return eventEmitter.addListener(this.EVENT_TAG_READ, callback);
  }

  /**
   * Add a listener for inventory start events
   * @param callback Function to call when inventory starts
   * @returns Subscription object
   */
  static addInventoryStartListener(
    callback: InventoryStatusCallback,
  ): EmitterSubscription {
    return eventEmitter.addListener(this.EVENT_INVENTORY_START, callback);
  }

  /**
   * Add a listener for inventory stop events
   * @param callback Function to call when inventory stops
   * @returns Subscription object
   */
  static addInventoryStopListener(
    callback: InventoryStatusCallback,
  ): EmitterSubscription {
    return eventEmitter.addListener(this.EVENT_INVENTORY_STOP, callback);
  }

  /**
   * Add a listener for trigger button press events
   * @param callback Function to call when trigger button is pressed
   * @returns Subscription object
   */
  static addTriggerPressListener(
    callback: InventoryStatusCallback,
  ): EmitterSubscription {
    return eventEmitter.addListener('onTriggerPress', callback);
  }

  /**
   * Add a listener for trigger button release events
   * @param callback Function to call when trigger button is released
   * @returns Subscription object
   */
  static addTriggerReleaseListener(
    callback: InventoryStatusCallback,
  ): EmitterSubscription {
    return eventEmitter.addListener('onTriggerRelease', callback);
  }

  /**
   * Remove all event listeners
   */
  static removeAllListeners(): void {
    eventEmitter.removeAllListeners(this.EVENT_TAG_READ);
    eventEmitter.removeAllListeners(this.EVENT_INVENTORY_START);
    eventEmitter.removeAllListeners(this.EVENT_INVENTORY_STOP);
    eventEmitter.removeAllListeners('onTriggerPress');
    eventEmitter.removeAllListeners('onTriggerRelease');
  }
}

export default ChainwayRFID;
