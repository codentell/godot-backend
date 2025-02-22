import OpenAI from 'openai';
import Cors from 'cors';


const cors = Cors({
  origin: 'https://hello-test-godot.vercel.app', // Replace with your frontend URL
  methods: ['POST', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true, // Allow credentials if needed
});

function runMiddleware(
  req,
  res,
  fn
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // API key from environment variable
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://hello-test-godot.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end(); // End the preflight request
  }

  // Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  await runMiddleware(req, res, cors);

  try {
    const { prompt } = req.body;
    const { score, location } = req.body; 

    console.log(prompt)

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required in the request body.' });
    }
    


    let NPCTemplate = `
    # Gunter Erikson

    ## Likes
    - Solitude in Arctic landscapes
    - Traditional navigation methods
    - Norwegian folk music

    ## Dislikes
    - Unnecessary small talk
    - Modern technology (especially smartphones)
    - Climate change deniers

    Setting: ${location}

    You are approaching Gunter Erikson, the renowned Arctic explorer and marine biologist. He's 
    [current activity - e.g., examining ice core samples, adjusting his ancient sextant, writing in his journal]. 
    His thick beard is frosted, and his blue eyes are focused intently on his task. As you come closer, he glances up, 
    his expression a mixture of mild annoyance at being interrupted and curiosity about your presence.

    You: ${prompt}

    Gunter: [Gunters response, considering his personality, likes, and dislikes]

    Gunter: [Gunters reply, potentially warming up or becoming more distant depending on the interaction]

    `



    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: NPCTemplate }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false, // Change to true if you want to stream data
    });


    const sentiment = await openai.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: `Get me the sentiment score of the prompt rating -5 to positive 5: ${prompt} just only the number.` }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false, // Change to true if you want to stream data
    });



    let total_score = (score + parseFloat(sentiment.choices[0]?.message?.content))

    

    



    // Send the response back to the client
    // Katherine 
    // Gunter 
    // Dave 

    res.status(200).json({ completion: completion.choices[0]?.message?.content, sentiment: parseFloat(sentiment.choices[0]?.message?.content), score: total_score });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}
