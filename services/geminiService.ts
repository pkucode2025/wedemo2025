// Mock AI Service
// This service replaces the Google GenAI dependency to allow the app to run without an API key.

const MOCK_RESPONSES = [
  "That's interesting! Tell me more.",
  "I see what you mean.",
  "Haha, that's funny! 😂",
  "I'm just a demo bot, but I'm listening!",
  "Could you explain that in a different way?",
  "The weather is nice today, isn't it? ☀️",
  "I'm learning so much from you.",
  "Beep boop! 🤖",
  "Have you tried turning it off and on again?",
  "React is awesome!",
];

export const sendMessageToGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Return a random response
  const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  return randomResponse;
};