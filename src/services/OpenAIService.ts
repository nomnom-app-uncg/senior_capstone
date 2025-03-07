//openaiservice.ts
import axios from "axios";
import * as FileSystem from "expo-file-system";

const API_KEY = "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";

const openAI = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
});



export const analyzeImageWithGPT = async (base64Image: string) => {
  try {
    if (!base64Image) throw new Error("No image data provided.");
    const formattedImage = `data:image/jpeg;base64,${base64Image}`;
    const response = await openAI.post("/chat/completions", {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify the dish from the image, then provide a detailed recipe including ingredients, step-by-step instructions, and any potential allergy restrictions (such as dairy, gluten, nuts, etc.). 
Ensure your response starts with "This is [dish name]" where [dish name] is the actual name of the dish, and avoid phrases like "This looks like".`
            },
            {
              type: "image_url",
              image_url: { url: formattedImage },
            },
          ],
        },
      ],
      max_tokens: 600,
    });
    return response.data.choices?.[0]?.message?.content || "No recipe available.";
  } catch (error: any) {
    console.error("Error analyzing image:", error?.response?.data || error.message);
    return "Failed to fetch recipe.";
  }
};

export const generateText = async (prompt: string) => {
  try {
    const response = await openAI.post("/chat/completions", {
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });
    return response.data.choices?.[0]?.message?.content || "No response available.";
  } catch (error) {
    console.error("Error generating text:", error);
    return "Failed to generate text.";
  }
};

export const getDishesFromIngredients = async (ingredients: string) => {
  try {
    const response = await openAI.post("/chat/completions", {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on these ingredients: ${ingredients}, provide exactly one detailed recipe.
Each recipe should include:
- Dish Name
- Serving Size
- Ingredients with exact measurements
- Step-by-step cooking instructions
- Additional tips

Return the recipe in a clear, structured format without extra commentary.`,
        },
      ],
      max_tokens: 600,
    });
    return response.data.choices?.[0]?.message?.content || "No detailed recipe found.";
  } catch (error) {
    console.error("Error fetching detailed recipe:", error);
    return "Failed to fetch detailed recipe.";
  }
};
