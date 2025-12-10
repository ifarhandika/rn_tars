import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import RFIDExample from './src/RFIDExample';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <RFIDExample />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;