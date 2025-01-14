import OpenAI from 'openai';
import Cors from 'cors';


const cors = Cors({
  origin: "*",
  methods: ["POST", "GET", "OPTIONS", "HEAD"],
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  await runMiddleware(req, res, cors);

  try {
    const { prompt } = req.body;
    console.log(prompt)

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required in the request body.' });
    }

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false, // Change to true if you want to stream data
    });

    // Send the response back to the client
    res.status(200).json({ completion: completion.choices[0]?.message?.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}
