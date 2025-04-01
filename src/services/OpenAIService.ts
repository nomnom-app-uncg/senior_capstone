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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Generate 4 different recipes based on these ingredients: ${ingredients}. 
          
          For each recipe, format it exactly like this:
          -------------------
          Recipe: [Dish Name]
          [Detailed recipe content with ingredients and instructions]
          Image URL: [URL will be added here]
          -------------------
          
          Keep the response clear and structured. Each recipe should be separated by the dashed line.
          Focus on using the provided ingredients creatively.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const recipes = response.data.choices?.[0]?.message?.content || "";
    
    // Generate images for each recipe sequentially
    const recipeBlocks = recipes.split('-------------------').filter((block: string) => block.trim());
    const recipesWithImages = [];
    
    for (const block of recipeBlocks) {
      try {
        const titleLine = block.split('\n').find((line: string) => line.startsWith('Recipe:'));
        const title = titleLine ? titleLine.replace('Recipe:', '').trim() : '';
        
        // Generate image for the recipe
        const dalleResponse = await openAI.post("/images/generations", {
          model: "dall-e-3",
          prompt: `A professional food photography of ${title}, high quality, well-lit, appetizing, using the ingredients: ${ingredients}`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const imageUrl = dalleResponse.data.data?.[0]?.url;
        if (!imageUrl) {
          console.error("No image URL generated for recipe:", title);
          recipesWithImages.push(block.replace('Image URL: [URL will be added here]', 'Image URL: https://via.placeholder.com/400x300?text=No+Image'));
        } else {
          recipesWithImages.push(block.replace('Image URL: [URL will be added here]', `Image URL: ${imageUrl}`));
        }
        
        // Add a delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error generating image for recipe:", error);
        recipesWithImages.push(block.replace('Image URL: [URL will be added here]', 'Image URL: https://via.placeholder.com/400x300?text=No+Image'));
      }
    }

    return recipesWithImages.join('\n-------------------\n');
  } catch (error) {
    console.error("Error fetching detailed recipe:", error);
    return "Failed to fetch detailed recipe.";
  }
};

export const generateRecipeWithImage = async (cuisine: string) => {
  try {
    const response = await openAI.post("/chat/completions", {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Generate a detailed recipe for a ${cuisine} dish. Include:
          - Title
          - Cooking time
          - Rating (1-5)
          - Brief description
          - List of ingredients with measurements
          - Step-by-step instructions
          - Number of servings
          - Difficulty level (Easy/Medium/Hard)
          
          Return ONLY a JSON object with these exact keys, no markdown formatting or additional text:
          {
            "title": "",
            "time": "",
            "rating": 0,
            "description": "",
            "ingredients": [],
            "instructions": [],
            "servings": "",
            "difficulty": ""
          }`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Clean the response to remove any markdown formatting
    const content = response.data.choices?.[0]?.message?.content || "{}";
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const recipeData = JSON.parse(cleanContent);

    return recipeData;
  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
};

export const generateTrendingRecipes = async () => {
  try {
    const cuisines = ['Italian', 'Mexican', 'Japanese', 'Indian', 'Mediterranean', 'Thai', 'Chinese', 'American'];
    const randomCuisines = cuisines.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    // Generate recipes sequentially to avoid rate limiting
    const recipes = [];
    for (const cuisine of randomCuisines) {
      try {
        const recipe = await generateRecipeWithImage(cuisine);
        if (recipe) {
          // Use Unsplash API for image search
          const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(recipe.title)}&per_page=1`,
            {
              headers: {
                'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
              }
            }
          );
          
          const imageData = await unsplashResponse.json();
          if (imageData.results && imageData.results.length > 0) {
            recipe.image = imageData.results[0].urls.regular;
          } else {
            recipe.image = "https://via.placeholder.com/400x300?text=No+Image";
          }
          
          recipes.push(recipe);
        }
        // Add a delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating recipe for ${cuisine}:`, error);
        // Add a placeholder recipe if generation fails
        recipes.push({
          title: `${cuisine} Delight`,
          time: "30 mins",
          rating: 4,
          description: "A delicious dish that couldn't be generated at this time.",
          ingredients: ["Ingredients not available"],
          instructions: ["Instructions not available"],
          servings: "4",
          difficulty: "Medium",
          image: "https://via.placeholder.com/400x300?text=Recipe+Unavailable"
        });
      }
    }

    return recipes;
  } catch (error) {
    console.error("Error generating trending recipes:", error);
    return [];
  }
};

