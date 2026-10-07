import fs from 'fs';
import { CONFIG_API_KEYS, PROVIDERS } from './config.js';

async function verifyOpenRouter() {
    console.log("Fetching OpenRouter models...");
    try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        const data = await res.json();
        const availableIds = new Set(data.data.map(m => m.id));
        
        const myModels = PROVIDERS.openrouter.models;
        const missing = myModels.filter(m => !availableIds.has(m));
        console.log("Missing models in config:", missing);
        console.log("Available models from config:", myModels.filter(m => availableIds.has(m)));
        
        console.log("\nTesting fallback array length limit...");
        const validModel = data.data.find(m => m.id.includes('free'))?.id || "google/gemma-2-9b-it:free";
        const testModels = new Array(10).fill(validModel);
        
        const payload = {
            models: testModels,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 10
        };
        
        const key = CONFIG_API_KEYS[0].key;
        const chatRes = await fetch(PROVIDERS.openrouter.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log("Status:", chatRes.status);
        if (!chatRes.ok) {
            const err = await chatRes.text();
            console.log("Error body:", err);
        } else {
            console.log("Success with 10 models array!");
        }
    } catch (e) {
        console.error("Test failed", e);
    }
}
verifyOpenRouter();
