package com.rn_tars.rfid;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.rscja.deviceapi.RFIDWithUHFUART;
import com.rscja.deviceapi.entity.UHFTAGInfo;
import com.rscja.deviceapi.interfaces.IUHF;
import com.rscja.deviceapi.interfaces.IUHFInventoryCallback;
import com.rscja.deviceapi.exception.ConfigurationException;

public class ChainwayRfidModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "ChainwayRfid";
    private static final String EVENT_TAG_READ = "onTagRead";
    private static final String EVENT_INVENTORY_START = "onInventoryStart";
    private static final String EVENT_INVENTORY_STOP = "onInventoryStop";
    
    private RFIDWithUHFUART rfidReader;
    private ReactApplicationContext reactContext;
    private Handler mainHandler;

    public ChainwayRfidModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Initialize the RFID reader
     */
    @ReactMethod
    public void init(Promise promise) {
        try {
            rfidReader = RFIDWithUHFUART.getInstance();
            boolean result = rfidReader.init(reactContext);
            
            if (result) {
                promise.resolve(true);
            } else {
                promise.reject("INIT_FAILED", "Failed to initialize RFID reader");
            }
        } catch (ConfigurationException e) {
            promise.reject("CONFIG_ERROR", "Configuration error: " + e.getMessage(), e);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", "Error initializing RFID reader: " + e.getMessage(), e);
        }
    }

    /**
     * Free/disconnect the RFID reader
     */
    @ReactMethod
    public void free(Promise promise) {
        try {
            if (rfidReader != null) {
                boolean result = rfidReader.free();
                promise.resolve(result);
            } else {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
            }
        } catch (Exception e) {
            promise.reject("FREE_ERROR", "Error freeing RFID reader: " + e.getMessage(), e);
        }
    }

    /**
     * Get RFID module version
     */
    @ReactMethod
    public void getVersion(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            String version = rfidReader.getVersion();
            if (version != null) {
                promise.resolve(version);
            } else {
                promise.reject("VERSION_ERROR", "Failed to get version");
            }
        } catch (Exception e) {
            promise.reject("VERSION_ERROR", "Error getting version: " + e.getMessage(), e);
        }
    }

    /**
     * Set power level (0-30)
     */
    @ReactMethod
    public void setPower(int power, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.setPower(power);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("POWER_ERROR", "Error setting power: " + e.getMessage(), e);
        }
    }

    /**
     * Get current power level
     */
    @ReactMethod
    public void getPower(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            int power = rfidReader.getPower();
            promise.resolve(power);
        } catch (Exception e) {
            promise.reject("POWER_ERROR", "Error getting power: " + e.getMessage(), e);
        }
    }

    /**
     * Set frequency mode
     * 0x01: China Standard (840~845MHz)
     * 0x02: China Standard2 (920~925MHz)
     * 0x04: Europe Standard (865~868MHz)
     * 0x08: USA (902-928MHz)
     * 0x16: Korea (917~923MHz)
     */
    @ReactMethod
    public void setFrequencyMode(int mode, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.setFrequencyMode(mode);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("FREQUENCY_ERROR", "Error setting frequency: " + e.getMessage(), e);
        }
    }

    /**
     * Get frequency mode
     */
    @ReactMethod
    public void getFrequencyMode(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            int mode = rfidReader.getFrequencyMode();
            promise.resolve(mode);
        } catch (Exception e) {
            promise.reject("FREQUENCY_ERROR", "Error getting frequency: " + e.getMessage(), e);
        }
    }

    /**
     * Start continuous inventory (tag reading)
     */
    @ReactMethod
    public void startInventory(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }

            // Set up callback for tag reading
            rfidReader.setInventoryCallback(new IUHFInventoryCallback() {
                @Override
                public void callback(UHFTAGInfo uhftagInfo) {
                    sendTagReadEvent(uhftagInfo);
                }
            });

            boolean result = rfidReader.startInventoryTag();
            
            if (result) {
                sendEvent(EVENT_INVENTORY_START, null);
                promise.resolve(true);
            } else {
                promise.reject("START_ERROR", "Failed to start inventory");
            }
        } catch (Exception e) {
            promise.reject("START_ERROR", "Error starting inventory: " + e.getMessage(), e);
        }
    }

    /**
     * Stop continuous inventory
     */
    @ReactMethod
    public void stopInventory(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.stopInventory();
            
            if (result) {
                sendEvent(EVENT_INVENTORY_STOP, null);
                promise.resolve(true);
            } else {
                promise.reject("STOP_ERROR", "Failed to stop inventory");
            }
        } catch (Exception e) {
            promise.reject("STOP_ERROR", "Error stopping inventory: " + e.getMessage(), e);
        }
    }

    /**
     * Read a single tag
     */
    @ReactMethod
    public void inventorySingleTag(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            UHFTAGInfo tagInfo = rfidReader.inventorySingleTag();
            
            if (tagInfo != null) {
                WritableMap tag = createTagMap(tagInfo);
                promise.resolve(tag);
            } else {
                promise.reject("NO_TAG", "No tag found");
            }
        } catch (Exception e) {
            promise.reject("READ_ERROR", "Error reading tag: " + e.getMessage(), e);
        }
    }

    /**
     * Read data from a tag
     * @param accessPwd Access password (4 bytes hex)
     * @param bank Memory bank (1=EPC, 2=TID, 3=USER)
     * @param ptr Start address (in words)
     * @param cnt Length to read (in words)
     */
    @ReactMethod
    public void readData(String accessPwd, int bank, int ptr, int cnt, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            String data = rfidReader.readData(accessPwd, bank, ptr, cnt);
            
            if (data != null) {
                promise.resolve(data);
            } else {
                promise.reject("READ_ERROR", "Failed to read data from tag");
            }
        } catch (Exception e) {
            promise.reject("READ_ERROR", "Error reading data: " + e.getMessage(), e);
        }
    }

    /**
     * Write data to a tag
     * @param accessPwd Access password (4 bytes hex)
     * @param bank Memory bank (1=EPC, 2=TID, 3=USER)
     * @param ptr Start address (in words)
     * @param cnt Length to write (in words)
     * @param data Data to write (hex string)
     */
    @ReactMethod
    public void writeData(String accessPwd, int bank, int ptr, int cnt, String data, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.writeData(accessPwd, bank, ptr, cnt, data);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("WRITE_ERROR", "Error writing data: " + e.getMessage(), e);
        }
    }

    /**
     * Write EPC to a tag
     * @param accessPwd Access password (4 bytes hex)
     * @param epcData EPC data to write (hex string)
     */
    @ReactMethod
    public void writeEPC(String accessPwd, String epcData, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.writeDataToEpc(accessPwd, epcData);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("WRITE_ERROR", "Error writing EPC: " + e.getMessage(), e);
        }
    }

    /**
     * Set filter for inventory
     * @param bank Memory bank to filter (1=EPC, 2=TID, 3=USER)
     * @param ptr Start address (in bits)
     * @param cnt Length (in bits)
     * @param data Filter data (hex string)
     */
    @ReactMethod
    public void setFilter(int bank, int ptr, int cnt, String data, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.setFilter(bank, ptr, cnt, data);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("FILTER_ERROR", "Error setting filter: " + e.getMessage(), e);
        }
    }

    /**
     * Lock tag memory
     * @param accessPwd Access password (4 bytes hex)
     * @param lockCode Lock code generated by generateLockCode
     */
    @ReactMethod
    public void lockTag(String accessPwd, String lockCode, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.lockMem(accessPwd, lockCode);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("LOCK_ERROR", "Error locking tag: " + e.getMessage(), e);
        }
    }

    /**
     * Kill/destroy a tag
     * @param killPwd Kill password (4 bytes hex)
     */
    @ReactMethod
    public void killTag(String killPwd, Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.killTag(killPwd);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("KILL_ERROR", "Error killing tag: " + e.getMessage(), e);
        }
    }

    /**
     * Check if inventory is running
     */
    @ReactMethod
    public void isInventorying(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.isInventorying();
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("STATUS_ERROR", "Error checking inventory status: " + e.getMessage(), e);
        }
    }

    /**
     * Set inventory mode
     * Call this before starting inventory to read TID and USER data
     */
    @ReactMethod
    public void setEPCMode(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.setEPCMode();
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("MODE_ERROR", "Error setting EPC mode: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void setEPCAndTIDMode(Promise promise) {
        try {
            if (rfidReader == null) {
                promise.reject("NOT_INITIALIZED", "RFID reader not initialized");
                return;
            }
            
            boolean result = rfidReader.setEPCAndTIDMode();
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("MODE_ERROR", "Error setting EPC+TID mode: " + e.getMessage(), e);
        }
    }

    // Helper methods

    private WritableMap createTagMap(UHFTAGInfo tagInfo) {
        WritableMap map = Arguments.createMap();
        
        if (tagInfo != null) {
            map.putString("epc", tagInfo.getEPC() != null ? tagInfo.getEPC() : "");
            map.putString("tid", tagInfo.getTid() != null ? tagInfo.getTid() : "");
            map.putString("user", tagInfo.getUser() != null ? tagInfo.getUser() : "");
            map.putString("rssi", tagInfo.getRssi() != null ? tagInfo.getRssi() : "");
            map.putString("count", String.valueOf(tagInfo.getCount()));
        }
        
        return map;
    }

    private void sendTagReadEvent(UHFTAGInfo tagInfo) {
        WritableMap tag = createTagMap(tagInfo);
        sendEvent(EVENT_TAG_READ, tag);
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    // Constants for React Native
    @Override
    public java.util.Map<String, Object> getConstants() {
        final java.util.Map<String, Object> constants = new java.util.HashMap<>();
        
        // Memory banks
        constants.put("BANK_RESERVED", IUHF.Bank_RESERVED);
        constants.put("BANK_EPC", IUHF.Bank_EPC);
        constants.put("BANK_TID", IUHF.Bank_TID);
        constants.put("BANK_USER", IUHF.Bank_USER);
        
        // Frequency modes
        constants.put("FREQ_CHINA_840", 0x01);
        constants.put("FREQ_CHINA_920", 0x02);
        constants.put("FREQ_EUROPE", 0x04);
        constants.put("FREQ_USA", 0x08);
        constants.put("FREQ_KOREA", 0x16);
        constants.put("FREQ_JAPAN", 0x32);
        
        // Event names
        constants.put("EVENT_TAG_READ", EVENT_TAG_READ);
        constants.put("EVENT_INVENTORY_START", EVENT_INVENTORY_START);
        constants.put("EVENT_INVENTORY_STOP", EVENT_INVENTORY_STOP);
        
        return constants;
    }
}
