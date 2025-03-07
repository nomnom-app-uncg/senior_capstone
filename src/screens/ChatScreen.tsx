import React, { useState } from "react";
import {
  SafeAreaView,
  TextInput,
  Button,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { generateText } from "@/services/OpenAIService"; // ✅ Fixed import

export default function ChatScreen() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleSendPrompt = async () => {
    try {
      const result = await generateText(prompt);
      setResponse(result);
    } catch (error) {
      console.error("Failed to fetch response:", error);
      setResponse("Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your prompt"
          value={prompt}
          onChangeText={setPrompt}
        />
        <Button title="Send" onPress={handleSendPrompt} />
      </View>
      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  inputContainer: { marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 4, marginBottom: 8 },
  responseContainer: { marginTop: 24 },
  responseText: { fontSize: 16, fontStyle: "italic" },
});
