const { GoogleGenAI } = require("@google/genai");

async function getAIFeedback(code, fileName) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are a senior software engineer doing a code review.
Review the following file (${fileName || "unnamed file"}) and give concise, actionable feedback.
Focus on: code quality, potential bugs, security concerns, and best practices.
Keep your response under 200 words, formatted as a short bulleted list.

Code:
\`\`\`
${code}
\`\`\`
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}

module.exports = { getAIFeedback };