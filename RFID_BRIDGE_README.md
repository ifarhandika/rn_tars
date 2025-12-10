# Chainway C5 RFID React Native Bridge

A complete React Native bridge for the Chainway C5 UHF RFID reader, providing access to all major RFID functionality through a simple JavaScript/TypeScript API.

## Features

- ✅ Initialize and connect to RFID reader
- ✅ Continuous tag inventory with real-time callbacks
- ✅ Single tag reading
- ✅ Read/Write tag data (EPC, TID, USER memory)
- ✅ Power control (0-30 dBm)
- ✅ Frequency mode configuration
- ✅ Tag filtering
- ✅ Tag locking and killing
- ✅ TypeScript support with full type definitions
- ✅ Event-based architecture for tag reading

## Installation

### 1. Android Configuration

The SDK is already integrated. Make sure you have the following files:

- `API_Ver20250209/DeviceAPI_ver20250209_release.aar` - The Chainway SDK
- `android/app/src/main/java/com/rn_tars/rfid/ChainwayRfidModule.java` - Native bridge module
- `android/app/src/main/java/com/rn_tars/rfid/ChainwayRfidPackage.java` - Package registration

### 2. Permissions

Add required permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Usage

### Basic Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import ChainwayRFID, { TagInfo } from './src/ChainwayRFID';

function App() {
  const [isReading, setIsReading] = useState(false);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    initializeRFID();

    // Set up tag listener
    const tagSubscription = ChainwayRFID.addTagReadListener(tag => {
      console.log('Tag read:', tag.epc, 'RSSI:', tag.rssi);

      // Add unique tags to list
      setTags(prevTags => {
        const exists = prevTags.find(t => t.epc === tag.epc);
        if (!exists) {
          return [...prevTags, tag];
        }
        return prevTags;
      });
    });

    return () => {
      // Clean up
      tagSubscription.remove();
      ChainwayRFID.stopInventory();
      ChainwayRFID.free();
    };
  }, []);

  const initializeRFID = async () => {
    try {
      // Initialize reader
      const initialized = await ChainwayRFID.init();
      console.log('RFID Initialized:', initialized);

      // Get version
      const ver = await ChainwayRFID.getVersion();
      setVersion(ver);
      console.log('RFID Version:', ver);

      // Set power to 26 dBm
      await ChainwayRFID.setPower(26);

      // Set frequency mode (USA)
      await ChainwayRFID.setFrequencyMode(ChainwayRFID.FREQ_USA);

      // Set inventory mode to read EPC and TID
      await ChainwayRFID.setEPCAndTIDMode();
    } catch (error) {
      console.error('Failed to initialize RFID:', error);
    }
  };

  const startReading = async () => {
    try {
      setTags([]); // Clear previous tags
      await ChainwayRFID.startInventory();
      setIsReading(true);
    } catch (error) {
      console.error('Failed to start reading:', error);
    }
  };

  const stopReading = async () => {
    try {
      await ChainwayRFID.stopInventory();
      setIsReading(false);
    } catch (error) {
      console.error('Failed to stop reading:', error);
    }
  };

  const readSingleTag = async () => {
    try {
      const tag = await ChainwayRFID.inventorySingleTag();
      console.log('Single tag read:', tag);
      alert(`Tag EPC: ${tag.epc}\nRSSI: ${tag.rssi}`);
    } catch (error) {
      console.error('Failed to read single tag:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chainway C5 RFID Reader</Text>
      <Text style={styles.version}>Version: {version}</Text>

      <View style={styles.buttonContainer}>
        <Button
          title={isReading ? 'Stop Reading' : 'Start Reading'}
          onPress={isReading ? stopReading : startReading}
        />
        <Button
          title="Read Single Tag"
          onPress={readSingleTag}
          disabled={isReading}
        />
        <Button title="Clear Tags" onPress={() => setTags([])} />
      </View>

      <Text style={styles.count}>Tags Found: {tags.length}</Text>

      <FlatList
        data={tags}
        keyExtractor={(item, index) => `${item.epc}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.tagItem}>
            <Text style={styles.epc}>EPC: {item.epc}</Text>
            <Text style={styles.detail}>TID: {item.tid || 'N/A'}</Text>
            <Text style={styles.detail}>RSSI: {item.rssi} dBm</Text>
            <Text style={styles.detail}>Count: {item.count}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  tagItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  epc: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detail: {
    fontSize: 14,
    color: '#666',
  },
});

export default App;
```

### Advanced Examples

#### Reading Tag Data

```typescript
// Read user memory from a tag
const readUserData = async (epc: string) => {
  try {
    // Set filter to target specific tag
    await ChainwayRFID.setFilter(
      ChainwayRFID.BANK_EPC, // Filter by EPC
      32, // Start at bit 32
      epc.length * 4, // Length in bits
      epc, // EPC to match
    );

    // Read 4 words from USER memory starting at address 0
    const data = await ChainwayRFID.readData(
      '00000000', // Access password
      ChainwayRFID.BANK_USER, // USER memory bank
      0, // Start address
      4, // Number of words
    );

    console.log('User data:', data);

    // Clear filter
    await ChainwayRFID.setFilter(ChainwayRFID.BANK_EPC, 0, 0, '');
  } catch (error) {
    console.error('Failed to read user data:', error);
  }
};
```

#### Writing to a Tag

```typescript
// Write EPC to a tag
const writeEPC = async (newEpc: string) => {
  try {
    const success = await ChainwayRFID.writeEPC(
      '00000000', // Access password (default)
      newEpc, // New EPC data (hex string)
    );

    if (success) {
      console.log('EPC written successfully');
    }
  } catch (error) {
    console.error('Failed to write EPC:', error);
  }
};

// Write custom data to USER memory
const writeUserData = async (data: string) => {
  try {
    const success = await ChainwayRFID.writeData(
      '00000000', // Access password
      ChainwayRFID.BANK_USER, // USER memory bank
      0, // Start address
      2, // Number of words
      data, // Data in hex
    );

    if (success) {
      console.log('Data written successfully');
    }
  } catch (error) {
    console.error('Failed to write data:', error);
  }
};
```

#### Using Filters

```typescript
// Only read tags with specific EPC prefix
const filterByPrefix = async (prefix: string) => {
  try {
    await ChainwayRFID.setFilter(
      ChainwayRFID.BANK_EPC, // Filter EPC bank
      32, // Start at bit 32 (after PC and CRC)
      prefix.length * 4, // Length in bits
      prefix, // Prefix to match
    );

    await ChainwayRFID.startInventory();

    // Only tags with matching prefix will be read
  } catch (error) {
    console.error('Failed to set filter:', error);
  }
};

// Clear filter to read all tags
const clearFilter = async () => {
  await ChainwayRFID.setFilter(ChainwayRFID.BANK_EPC, 0, 0, '');
};
```

#### Power and Frequency Management

```typescript
// Adjust power dynamically
const adjustPower = async (powerLevel: number) => {
  try {
    // Power range: 0-30 dBm
    await ChainwayRFID.setPower(powerLevel);
    const currentPower = await ChainwayRFID.getPower();
    console.log('Power set to:', currentPower, 'dBm');
  } catch (error) {
    console.error('Failed to set power:', error);
  }
};

// Set frequency for different regions
const setRegion = async (region: 'USA' | 'EUROPE' | 'CHINA' | 'KOREA') => {
  const frequencies = {
    USA: ChainwayRFID.FREQ_USA,
    EUROPE: ChainwayRFID.FREQ_EUROPE,
    CHINA: ChainwayRFID.FREQ_CHINA_920,
    KOREA: ChainwayRFID.FREQ_KOREA,
  };

  try {
    await ChainwayRFID.setFrequencyMode(frequencies[region]);
    console.log('Frequency set to:', region);
  } catch (error) {
    console.error('Failed to set frequency:', error);
  }
};
```

## API Reference

### Methods

#### `init(): Promise<boolean>`

Initialize the RFID reader. Must be called before any other operations.

#### `free(): Promise<boolean>`

Disconnect and free the RFID reader. Call when done using the reader.

#### `getVersion(): Promise<string>`

Get the RFID module firmware version.

#### `setPower(power: number): Promise<boolean>`

Set transmit power level (0-30 dBm).

#### `getPower(): Promise<number>`

Get current power level.

#### `setFrequencyMode(mode: number): Promise<boolean>`

Set frequency mode/region. Use `FREQ_*` constants.

#### `getFrequencyMode(): Promise<number>`

Get current frequency mode.

#### `startInventory(): Promise<boolean>`

Start continuous tag reading. Tags will be reported via event listener.

#### `stopInventory(): Promise<boolean>`

Stop continuous tag reading.

#### `inventorySingleTag(): Promise<TagInfo>`

Read a single tag (one-time, not continuous).

#### `readData(accessPwd: string, bank: number, ptr: number, cnt: number): Promise<string>`

Read data from tag memory.

- `accessPwd`: Access password (4 bytes hex)
- `bank`: Memory bank (use `BANK_*` constants)
- `ptr`: Start address in words
- `cnt`: Number of words to read

#### `writeData(accessPwd: string, bank: number, ptr: number, cnt: number, data: string): Promise<boolean>`

Write data to tag memory.

#### `writeEPC(accessPwd: string, epcData: string): Promise<boolean>`

Write EPC data to a tag.

#### `setFilter(bank: number, ptr: number, cnt: number, data: string): Promise<boolean>`

Set filter for inventory. Use `cnt: 0` to disable filter.

#### `setEPCMode(): Promise<boolean>`

Set inventory mode to read only EPC.

#### `setEPCAndTIDMode(): Promise<boolean>`

Set inventory mode to read EPC and TID.

### Event Listeners

#### `addTagReadListener(callback: (tag: TagInfo) => void): EmitterSubscription`

Listen for tag read events during inventory.

#### `addInventoryStartListener(callback: () => void): EmitterSubscription`

Listen for inventory start events.

#### `addInventoryStopListener(callback: () => void): EmitterSubscription`

Listen for inventory stop events.

### Constants

#### Memory Banks

- `BANK_RESERVED` - Reserved memory
- `BANK_EPC` - EPC memory
- `BANK_TID` - TID memory
- `BANK_USER` - User memory

#### Frequency Modes

- `FREQ_CHINA_840` - China 840-845MHz
- `FREQ_CHINA_920` - China 920-925MHz
- `FREQ_EUROPE` - Europe 865-868MHz
- `FREQ_USA` - USA 902-928MHz
- `FREQ_KOREA` - Korea 917-923MHz
- `FREQ_JAPAN` - Japan 916.8-920.8MHz

### Types

```typescript
interface TagInfo {
  epc: string; // EPC data
  tid: string; // TID data (if reading mode includes TID)
  user: string; // USER data (if reading mode includes USER)
  rssi: string; // Signal strength
  count: string; // Read count
}
```

## Troubleshooting

### Reader Not Initializing

- Ensure the device has RFID hardware
- Check that all permissions are granted
- Verify the SDK AAR file is in the correct location

### No Tags Being Read

- Check power level (try increasing)
- Verify frequency mode matches your region
- Ensure tags are in range (typically 1-6 meters)
- Check if a filter is set unintentionally

### Build Errors

- Run `cd android && ./gradlew clean`
- Ensure the AAR file path is correct in `build.gradle`
- Rebuild the app: `npx react-native run-android`

## License

This bridge code is provided as-is. The Chainway SDK is proprietary and subject to Chainway's license terms.

## Support

For issues with:

- The React Native bridge: Open an issue in your repository
- The Chainway SDK: Contact Chainway support
- Hardware issues: Contact your device vendor
