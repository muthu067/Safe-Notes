const { HfInference } = require('@huggingface/inference');

const HF_API_KEY = process.env.HF_API_KEY;
const hf = new HfInference(HF_API_KEY);

exports.askAboutNote = async (noteContent, question) => {
    if (!HF_API_KEY) {
        console.warn("HF_API_KEY not configured. Bypassing AI Q&A.");
        return "I'm sorry, my AI brain is currently disconnected. Please check the server configuration.";
    }

    let retries = 3;
    const models = ["Qwen/Qwen2.5-7B-Instruct", "mistralai/Mistral-7B-Instruct-v0.2"];

    while (retries > 0) {
        try {
            const currentModel = models[3 - retries] || models[0];
            const result = await hf.chatCompletion({
                model: currentModel,
                messages: [
                    {
                        role: "system",
                        content: "You are a concise study assistant. Answer questions ONLY based on the provided notes. Keep answers under 100 words."
                    },
                    {
                        role: "user",
                        content: `Notes Context:\n${noteContent}\n\nQuestion: ${question}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.1,
            });

            return result.choices[0]?.message?.content || "I couldn't generate an answer.";
        } catch (err) {
            retries--;
            console.error(`Inference Attempt Failed (Retries left: ${retries}):`, err.message);
            if (retries === 0) {
                return "The study models are currently busy. Please try asking again in a minute.";
            }

            await new Promise(r => setTimeout(r, 10000));
        }
    }
};
