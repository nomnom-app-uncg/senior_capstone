//CulinaryChatScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { generateText } from "@/services/OpenAIService";

type Message = {
  id: number;
  text: string;
  createdAt: Date;
  sender: "user" | "bot";
};

const suggestedQuestions = [
  "What are some quick meal ideas?",
  "How many calories are in a chicken breast?",
  "What's a good high-protein meal prep?",
  "Give me a romantic date night recipe!",
  "How do I substitute eggs in a recipe?",
  "What's the best way to store fresh herbs?",
  "How do I cook steak perfectly?",
  "What’s the difference between baking soda and baking powder?",
];

export default function CulinaryChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true); // Show suggested questions initially

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "Welcome to Culinary Assistant! Tap on a question below or ask anything about recipes, ingredients, or meal planning.",
        createdAt: new Date(),
        sender: "bot",
      },
    ]);
  }, []);

  const sendMessage = async (question?: string) => {
    const userText = question || inputText.trim();
    if (!userText) return;

    const userMessage: Message = {
      id: Date.now(),
      text: userText,
      createdAt: new Date(),
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setShowSuggestions(false); // Hide suggestions after first message
    Keyboard.dismiss();

    let botResponse = "";
    const lowerInput = userText.toLowerCase();

    // **Short, direct responses**
    if (["hi", "hello", "hey"].includes(lowerInput)) {
      botResponse = "How can I assist you with cooking today?";
    } else if (lowerInput.includes("recipe")) {
      botResponse = "What type of recipe do you need? I can suggest quick meals, dinner ideas, or special occasion dishes.";
    } else if (lowerInput.includes("calories")) {
      botResponse = "I can calculate calories for most foods! What ingredient or meal are you checking?";
    } else if (lowerInput.includes("meal prep")) {
      botResponse = "I can suggest meal prep ideas! Are you looking for high-protein, budget-friendly, or easy meals?";
    } else if (lowerInput.includes("date night")) {
      botResponse = "A romantic dinner? Try a three-course meal: appetizer, main dish, and dessert! Any preference on cuisine?";
    } else if (lowerInput.includes("substitute")) {
      botResponse = "I can help with ingredient substitutions! What ingredient do you need to replace?";
    } else if (lowerInput.includes("store") || lowerInput.includes("preserve")) {
      botResponse = "Storing food properly extends freshness! What ingredient are you storing?";
    } else {
      try {
        const conversationHistory = messages
          .slice(-6)
          .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
          .join("\n");

        const prompt = `
You are a helpful culinary chatbot that gives short, food-specific responses.
Always reply as if you're talking to someone planning or preparing food.

When the user says something like "more", "another", "next", or asks follow-up questions,
you must remember what was previously asked and continue helping with that same topic.

If they ask for a recipe, offer options.
If they seem interested, ask: "Would you like ingredients and instructions too?"

Conversation so far:
${conversationHistory}
User: ${userText}
Assistant:`.trim();



        botResponse = await generateText(prompt);
      } catch (error) {
        console.error("Error fetching bot response:", error);
        botResponse = "I'm not sure about that. Try asking a different food-related question!";
      }
    }

    const botMessage: Message = {
      id: Date.now() + 1,
      text: botResponse,
      createdAt: new Date(),
      sender: "bot",
    };

    setMessages((prev) => [...prev, botMessage]);

    // Auto-scroll only if the user is not manually scrolling
    if (!isUserScrolling) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {Platform.OS === "web" ? (
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => setIsUserScrolling(true)}
              onScrollEndDrag={() => setTimeout(() => setIsUserScrolling(false), 500)}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.sender === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              ))}

              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {suggestedQuestions.map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestedQuestion}
                      onPress={() => sendMessage(question)}
                    >
                      <Text style={styles.suggestedText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  Platform.OS === "web" ? { outlineWidth: 0, outlineColor: "transparent" } as any : {}
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder=" "
                multiline
                blurOnSubmit={false}
                autoFocus
                onSubmitEditing={() => setShowSuggestions(false)}
              />

              <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.chatContainer}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}

                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
              >

                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.sender === "user" ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.text}</Text>
                  </View>
                ))}

                {showSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {suggestedQuestions.map((question, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestedQuestion}
                        onPress={() => sendMessage(question)}
                      >
                        <Text style={styles.suggestedText}>{question}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder=" "
                  multiline
                  blurOnSubmit={false}
                  onSubmitEditing={() => setShowSuggestions(false)}
                />
                <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()}>
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: "#fff" },
  chatContainer: { flex: 1, padding: 10 },
  messagesContainer: {
    flex: 1,
    paddingBottom: 10,
    maxHeight: '100%',
  },
  
  suggestionsContainer: {
    marginTop: 5,
    paddingBottom: 10,
  },
  suggestedQuestion: {
    backgroundColor: "#f8f8f8",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 3,
    borderRadius: 6,
    width: "85%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  messageBubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    maxWidth: "75%",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  userBubble: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    marginBottom: 8,
    maxWidth: "75%",
  },
  botBubble: {
    backgroundColor: "#EEE",
    alignSelf: "flex-start",
  },
  messageText: { fontSize: 16, color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    paddingBottom: 50,
    backgroundColor: "#fff",
    marginBottom: Platform.OS === "ios" ? 10 : 0,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 5,

  },

  sendButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: { color: "#fff", fontWeight: "bold" },
});
