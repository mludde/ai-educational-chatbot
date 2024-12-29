import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ChatApp: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const idSession = localStorage.getItem("idSession");

  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  const retrieveHistory = async () => {
    if (idSession) {
      const response = await fetch("http://localhost:3000/api/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          idsession: idSession.substring(0, idSession.lastIndexOf("-")),
        },
      });
      const data = await response.json();
      if (data.history.length > 0) {
        console.log(data.history);
        setMessages(data.history);
      }
    }
  };

  // Controlla se l'utente è autenticato
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated === "false" || !isAuthenticated) {
      navigate("/"); // Se non autenticato, reindirizza alla pagina di login
    } else {
      retrieveHistory();
    }
  }, [navigate]);

  // Scrolla automaticamente all'ultimo messaggio quando messages cambia
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, idSession }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMessage: Message = {
          role: "bot",
          content: data.answer.content,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Errore nella risposta");
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "bot",
        content: "Errore: impossibile recuperare la risposta.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div style={styles.container}>
      <div ref={chatWindowRef} style={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={msg.role === "user" ? styles.userMessage : styles.botMessage}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          type="text"
          value={input}
          placeholder="Scrivi un messaggio..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.button} onClick={sendMessage}>
          Invia
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#f5f5f5",
  },
  chatWindow: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    borderBottom: "1px solid #ccc",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    marginLeft: "10px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px",
    borderRadius: "10px",
    margin: "5px 0",
    maxWidth: "70%",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e9ecef",
    padding: "10px",
    borderRadius: "10px",
    margin: "5px 0",
    maxWidth: "70%",
  },
};

export default ChatApp;
