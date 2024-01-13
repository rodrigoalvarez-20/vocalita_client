
import { SafeAreaView , StyleSheet } from 'react-native';
import Home from "./src/Home"
import { StatusBar } from 'expo-status-bar';

const App = () => {
  
  return (
    <SafeAreaView style={styles.container}>
      <Home />
      <StatusBar  style='dark' />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  }
})

export default App;