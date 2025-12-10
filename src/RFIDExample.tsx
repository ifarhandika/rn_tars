import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import ChainwayRFID, { TagInfo } from './ChainwayRFID';

export default function RFIDExample() {
  const [isReading, setIsReading] = useState(false);
  const [tags, setTags] = useState<Map<string, TagInfo>>(new Map());
  const [version, setVersion] = useState<string>('');
  const [power, setPower] = useState<number>(26);
  const [isInitialized, setIsInitialized] = useState(false);
  const [readMode, setReadMode] = useState<'EPC' | 'EPC+TID'>('EPC+TID');

  const startReading = async () => {
    try {
      setTags(new Map()); // Clear previous tags
      await ChainwayRFID.startInventory();
      setIsReading(true);
    } catch (error: any) {
      console.error('Start reading error:', error);
      Alert.alert('Error', `Failed to start reading: ${error.message}`);
    }
  };

  const stopReading = async () => {
    try {
      await ChainwayRFID.stopInventory();
      setIsReading(false);
    } catch (error: any) {
      console.error('Stop reading error:', error);
      Alert.alert('Error', `Failed to stop reading: ${error.message}`);
    }
  };

  useEffect(() => {
    initializeRFID();

    // Set up tag listener
    const tagSubscription = ChainwayRFID.addTagReadListener(tag => {
      setTags(prevTags => {
        const newTags = new Map(prevTags);
        if (prevTags.has(tag.epc)) {
          const existingTag = prevTags.get(tag.epc)!;
          tag.count = String(parseInt(existingTag.count || '1') + 1);
        }
        newTags.set(tag.epc, tag);
        return newTags;
      });
    });

    const startSubscription = ChainwayRFID.addInventoryStartListener(() => {
      console.log('Inventory started');
      setIsReading(true);
    });

    const stopSubscription = ChainwayRFID.addInventoryStopListener(() => {
      console.log('Inventory stopped');
      setIsReading(false);
    });

    // Add hardware trigger button listeners
    const triggerPressSubscription = ChainwayRFID.addTriggerPressListener(() => {
      console.log('Trigger pressed');
      ChainwayRFID.isInventorying().then(inventorying => {
        if (!inventorying) {
          startReading();
        }
      }).catch(console.error);
    });

    const triggerReleaseSubscription = ChainwayRFID.addTriggerReleaseListener(() => {
      console.log('Trigger released');
      ChainwayRFID.isInventorying().then(inventorying => {
        if (inventorying) {
          stopReading();
        }
      }).catch(console.error);
    });

    return () => {
      // Clean up - only remove listeners, don't stop inventory or free reader
      tagSubscription.remove();
      startSubscription.remove();
      stopSubscription.remove();
      triggerPressSubscription.remove();
      triggerReleaseSubscription.remove();
    };
  }, []);

  const initializeRFID = async () => {
    try {
      // Initialize reader
      const initialized = await ChainwayRFID.init();
      if (!initialized) {
        Alert.alert('Error', 'Failed to initialize RFID reader');
        return;
      }

      // Get version
      const ver = await ChainwayRFID.getVersion();
      setVersion(ver);

      // Set initial power
      await ChainwayRFID.setPower(power);

      // Set frequency mode (adjust for your region)
      await ChainwayRFID.setFrequencyMode(ChainwayRFID.FREQ_USA);

      // Set inventory mode
      await ChainwayRFID.setEPCAndTIDMode();

      setIsInitialized(true);
      Alert.alert('Success', `RFID Reader Initialized\nVersion: ${ver}`);
    } catch (error: any) {
      console.error('Failed to initialize RFID:', error);
      Alert.alert('Error', `Initialization failed: ${error.message}`);
    }
  };

  const readSingleTag = async () => {
    try {
      const tag = await ChainwayRFID.inventorySingleTag();
      Alert.alert(
        'Tag Read',
        `EPC: ${tag.epc}\nTID: ${tag.tid || 'N/A'}\nRSSI: ${tag.rssi} dBm`,
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to read tag: ${error.message}`);
    }
  };

  const adjustPower = async (newPower: number) => {
    try {
      await ChainwayRFID.setPower(newPower);
      const currentPower = await ChainwayRFID.getPower();
      setPower(currentPower);
      Alert.alert('Success', `Power set to ${currentPower} dBm`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to set power: ${error.message}`);
    }
  };

  const toggleReadMode = async (useEPCOnly: boolean) => {
    try {
      if (isReading) {
        Alert.alert('Info', 'Stop reading before changing mode');
        return;
      }

      if (useEPCOnly) {
        await ChainwayRFID.setEPCMode();
        setReadMode('EPC');
      } else {
        await ChainwayRFID.setEPCAndTIDMode();
        setReadMode('EPC+TID');
      }
      Alert.alert('Success', `Mode set to ${useEPCOnly ? 'EPC' : 'EPC+TID'}`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to change mode: ${error.message}`);
    }
  };

  const clearTags = () => {
    setTags(new Map());
  };

  const exportTags = () => {
    const tagList = Array.from(tags.values());
    console.log('Exporting tags:', JSON.stringify(tagList, null, 2));
    Alert.alert('Export', `${tagList.length} tags logged to console`);
  };

  const tagsArray = Array.from(tags.values());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chainway C5 RFID Reader</Text>
        <Text style={styles.version}>
          {isInitialized ? `Version: ${version}` : 'Not Initialized'}
        </Text>
        <Text style={styles.power}>Power: {power} dBm</Text>
        <Text style={styles.triggerHint}>📱 Press C5 trigger button to scan</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <View style={styles.button}>
            <Button
              title={isReading ? 'Stop Reading' : 'Start Reading'}
              onPress={isReading ? stopReading : startReading}
              color={isReading ? '#FF6B6B' : '#4CAF50'}
              disabled={!isInitialized}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Read Single"
              onPress={readSingleTag}
              disabled={!isInitialized || isReading}
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.button}>
            <Button
              title="Clear Tags"
              onPress={clearTags}
              disabled={isReading}
            />
          </View>
          <View style={styles.button}>
            <Button title="Export" onPress={exportTags} />
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text>EPC Only Mode:</Text>
          <Switch
            value={readMode === 'EPC'}
            onValueChange={toggleReadMode}
            disabled={!isInitialized || isReading}
          />
        </View>

        <View style={styles.powerControls}>
          <Text>Power Control:</Text>
          <View style={styles.powerButtons}>
            <TouchableOpacity
              style={styles.powerButton}
              onPress={() => adjustPower(Math.max(0, power - 5))}
              disabled={!isInitialized || isReading}
            >
              <Text>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.powerButton}
              onPress={() => adjustPower(Math.min(30, power + 5))}
              disabled={!isInitialized || isReading}
            >
              <Text>+5</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.stats}>
          Tags Found: {tagsArray.length} | Reading: {isReading ? 'Yes' : 'No'}
        </Text>
      </View>

      <FlatList
        data={tagsArray}
        keyExtractor={item => item.epc}
        renderItem={({ item, index }) => (
          <View style={styles.tagItem}>
            <View style={styles.tagHeader}>
              <Text style={styles.tagNumber}>#{index + 1}</Text>
              <Text style={styles.rssi}>RSSI: {item.rssi} dBm</Text>
            </View>
            <Text style={styles.epc}>EPC: {item.epc}</Text>
            {item.tid && <Text style={styles.detail}>TID: {item.tid}</Text>}
            {item.user && <Text style={styles.detail}>USER: {item.user}</Text>}
            <Text style={styles.count}>Read Count: {item.count}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isReading ? 'Scanning for tags...' : 'No tags found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  power: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  triggerHint: {
    fontSize: 14,
    color: 'white',
    opacity: 0.95,
    marginTop: 8,
    fontWeight: '600',
  },
  controls: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  powerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  powerButtons: {
    flexDirection: 'row',
  },
  powerButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginLeft: 10,
    borderRadius: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stats: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tagItem: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagNumber: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  rssi: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  epc: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  detail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  count: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
