import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { Mistral } from "@mistralai/mistralai";
import { Pool } from "pg";
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const mistral = new Mistral({
  apiKey: process.env.MISTRALSECRET,
});

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.DBNAME,
  password: process.env.DBPSW,
  port: Number(process.env.DBPORT),
});

app.post("/api/user", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Salva nel database
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      password,
    ]);

    res.json({});
  } catch (error) {
    console.error(error);
    if (error instanceof Error)
      res.status(500).json({ message: error.message });
    else res.status(500).json({ message: "An unknown error occurred." });
  }
});

app.get("/api/history", async (req, res) => {
  const { idsession } = req.headers;

  try {
    //Recupera cronologia
    const history = await pool.query(
      "SELECT * FROM interactions WHERE session_id LIKE $1 ORDER BY q_timestamp ASC",
      [idsession + "%"]
    );

    res.status(200).json({
      history: history.rows
        .map((h) => [
          {
            role: "bot",
            content: JSON.parse(h.answer).content,
            timestamp: h.a_timestamp,
          },
          {
            role: "user",
            content: h.question,
            timestamp: h.q_timestamp,
          },
        ])
        .flat(Infinity),
      // .sort((a, b) => a.timestamp < b.timestamp),
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error)
      res.status(500).json({ message: error.message });
    else res.status(500).json({ message: "An unknown error occurred." });
  }
});

// Endpoint per gestire le richieste
app.post("/api/chat", async (req, res) => {
  const { question, idSession } = req.body;
  let q_timestamp = new Date();
  try {
    // Invio del prompt a ChatGPT
    /*   const response = await openAI.chat.completions.create({
            model: 'gpt-3.5-turbo', // Usa 'gpt-3.5-turbo' se preferisci
            messages: [
                //{ role: 'system', content: 'Rispondi sempre in modo estremamente conciso, usando una sola parola se possibile.'},
                    { role: 'user', content: question }],
            max_tokens: 1000
          
        });*/

    //Invio del prompt a Mistral
    /*  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: {
                "model": "mistral-small-latest",
                "temperature": 1.5,
                "top_p": 1,
                "max_tokens": 0,
                "stream": false,
                "stop": "string",
                "random_seed": 0,
                "messages": [
                  {
                    "role": "user",
                    "content": question
                  }
                ],
                "tools": [
                  {
                    "type": "function",
                    "function": {
                      "name": "string",
                      "description": "",
                      "parameters": {}
                    }
                  }
                ],
                "tool_choice": "auto",
                "presence_penalty": 0,
                "frequency_penalty": 0,
                "n": 1,
                "safe_prompt": false
              }
        })*/

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          content: question,
          role: "user",
        },
      ],
    });
    //console.log(response.choices[0].message);
    /* const answer = {
              "role": "assistant",
              "content": "Sì.",
              "refusal": null
          }*/

    const answer =
      typeof response.choices === "undefined"
        ? "No answer"
        : response.choices[0].message;

    console.log(response);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Salva nel database
    await pool.query(
      "INSERT INTO interactions (id_serial, session_id, question, answer, q_timestamp, a_timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
      [uuidv4(), idSession, question, answer, q_timestamp, new Date()]
    );

    res.json({ answer });
  } catch (error) {
    console.error(error);
    if (error instanceof Error)
      res.status(500).json({ message: error.message });
    else res.status(500).json({ message: "An unknown error occurred." });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
