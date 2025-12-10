# Chainway C5 RFID - Quick Start Guide

## What Was Created

### 1. Native Android Bridge (`android/app/src/main/java/com/rn_tars/rfid/`)

- **ChainwayRfidModule.java** - Main native module with all RFID functionality
- **ChainwayRfidPackage.java** - React Native package registration

### 2. TypeScript Interface (`src/ChainwayRFID.ts`)

- Full TypeScript definitions
- Event emitter integration
- Type-safe API

### 3. Configuration Updates

- **android/app/build.gradle** - Added SDK dependency
- **MainApplication.kt** - Registered the package

## Integration Steps

### Step 1: Build the Project

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Step 2: Add Permissions to AndroidManifest.xml

Add these permissions inside `<manifest>` tag in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### Step 3: Use in Your React Native Code

```typescript
import ChainwayRFID from './src/ChainwayRFID';

// Initialize
await ChainwayRFID.init();

// Set up listener
const subscription = ChainwayRFID.addTagReadListener(tag => {
  console.log('Tag:', tag.epc, 'RSSI:', tag.rssi);
});

// Start reading
await ChainwayRFID.startInventory();

// Stop reading
await ChainwayRFID.stopInventory();

// Clean up
subscription.remove();
await ChainwayRFID.free();
```

## Minimal Example Component

Replace your `App.tsx` with this to test:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import ChainwayRFID, { TagInfo } from './src/ChainwayRFID';

export default function App() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [status, setStatus] = useState('Not initialized');

  useEffect(() => {
    initialize();
    const sub = ChainwayRFID.addTagReadListener(tag => {
      setTags(prev => {
        const exists = prev.find(t => t.epc === tag.epc);
        return exists ? prev : [...prev, tag];
      });
    });
    return () => {
      sub.remove();
      ChainwayRFID.free();
    };
  }, []);

  const initialize = async () => {
    try {
      const result = await ChainwayRFID.init();
      if (result) {
        const version = await ChainwayRFID.getVersion();
        await ChainwayRFID.setPower(26);
        setStatus(`Ready - Version: ${version}`);
      } else {
        setStatus('Failed to initialize');
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const toggleReading = async () => {
    try {
      if (isReading) {
        await ChainwayRFID.stopInventory();
        setIsReading(false);
      } else {
        setTags([]);
        await ChainwayRFID.startInventory();
        setIsReading(true);
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chainway RFID Test</Text>
      <Text style={styles.status}>{status}</Text>
      <Button title={isReading ? 'STOP' : 'START'} onPress={toggleReading} />
      <Text style={styles.count}>Tags: {tags.length}</Text>
      <ScrollView style={styles.list}>
        {tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.epc}>{tag.epc}</Text>
            <Text>RSSI: {tag.rssi}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  status: { fontSize: 14, marginBottom: 20, color: '#666' },
  count: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  list: { flex: 1 },
  tag: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
    borderRadius: 5,
  },
  epc: { fontWeight: 'bold' },
});
```

## Common Operations

### Read Single Tag

```typescript
const tag = await ChainwayRFID.inventorySingleTag();
console.log(tag.epc);
```

### Read Tag Data

```typescript
const data = await ChainwayRFID.readData(
  '00000000', // password
  ChainwayRFID.BANK_USER, // USER memory
  0, // address
  4, // length
);
```

### Write EPC

```typescript
await ChainwayRFID.writeEPC('00000000', 'E2003412A0123456789ABCDE');
```

### Filter Tags

```typescript
// Read only tags starting with "E200"
await ChainwayRFID.setFilter(ChainwayRFID.BANK_EPC, 32, 16, 'E200');
```

### Adjust Power

```typescript
await ChainwayRFID.setPower(20); // 20 dBm
```

## Troubleshooting

### Module Not Found Error

1. Make sure you ran `npx react-native run-android`
2. Check `MainApplication.kt` has `ChainwayRfidPackage()` added
3. Rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

### SDK Not Found Error

1. Verify `API_Ver20250209/DeviceAPI_ver20250209_release.aar` exists
2. Check path in `android/app/build.gradle` is correct
3. Clean and rebuild

### No Tags Reading

1. Increase power: `await ChainwayRFID.setPower(30)`
2. Check frequency mode matches your region
3. Ensure tags are within 1-6 meters
4. Verify antenna is not obstructed

### Permission Errors

Add all required permissions to AndroidManifest.xml and request them at runtime if needed.

## Architecture

```
React Native (JavaScript/TypeScript)
    ↓ (calls methods)
ChainwayRFID.ts (TypeScript wrapper)
    ↓ (NativeModules bridge)
ChainwayRfidModule.java (Native module)
    ↓ (uses)
DeviceAPI_ver20250209_release.aar (Chainway SDK)
    ↓ (controls)
Chainway C5 RFID Hardware
```

## Key Files

- `src/ChainwayRFID.ts` - Import this in your components
- `android/app/src/main/java/com/rn_tars/rfid/ChainwayRfidModule.java` - Native implementation
- `RFID_BRIDGE_README.md` - Full documentation

## Next Steps

1. Build and test the basic example
2. Add error handling and UI feedback
3. Implement your specific use case (inventory, asset tracking, etc.)
4. Optimize power and performance settings
5. Add features like tag filtering, batch operations, etc.

## Support

- Check `RFID_BRIDGE_README.md` for detailed API documentation
- Review SDK docs in `API_Ver20250209/doc/`
- Test on actual Chainway C5 hardware
