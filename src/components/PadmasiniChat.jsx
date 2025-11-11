import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./PadmasiniChat.css";

const PadmasiniChat = ({ subjectName = "" }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! How can I help you today?" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userEmail") || "student@example.com";

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: userInput }
    ];

    setMessages(newMessages);
    setUserInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        messages: newMessages
      });

      const aiReply = res.data.reply;
      setMessages([
        ...newMessages,
        { role: "assistant", content: aiReply }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I couldn't process that right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* temporary disabled ask padmasini button */}
      {/* <button className="chat-toggle" onClick={() => setChatOpen(true)}>
        Ask Padmasini 💬
      </button> */}

      {chatOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <span>Hi {userId.split("@")[0]} 👋</span>
            {subjectName && <p>Let's talk about <strong>{subjectName}</strong></p>}
            <button onClick={() => setChatOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            <div className="chat-body-header">
              <button
                className="chat-clear"
                onClick={() => {
                  if (window.confirm("Clear entire chat?")) {
                    setMessages([{ role: "assistant", content: "Hi! How can I help you today?" }]);
                  }
                }}
              >
                🗑️
              </button>
            </div>



            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-msg ${msg.role === "user" ? "user-msg" : "bot-msg"}`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && <div className="bot-msg">Typing...</div>}
            </div>

            <div className="chat-input-box">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask anything about NEET, JEE, etc..."
              />
              <button onClick={handleSend}>Send</button>
            </div>

            <hr />
            <div className="chat-help-section">
              <input placeholder="Search Articles..." className="chat-search" />
              <ul className="help-list">
                <li><Link to="/neet">📚 NEET</Link></li>
                <li><Link to="/physics">⚛️ NEET Physics</Link></li>
                <li><Link to="/chemistry">🧪 NEET Chemistry</Link></li>
                <li><Link to="/zoology">🧬 Zoology</Link></li>
                <li><Link to="/botany">🌿 Botany</Link></li>
                <li><Link to="/jee">📘 JEE</Link></li>
                <li><Link to="/physics1">⚙️ JEE Physics</Link></li>
                <li><Link to="/chemistry1">🧫 JEE Chemistry</Link></li>
                <li><Link to="/maths">➗ Mathematics</Link></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PadmasiniChat;
