import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// Header and branding
import logo from '../assets/logo2.png';
import headImage from '../assets/head.png';
import { useUser } from "../components/UserContext";
// Study Material Cards
import ncertImg from '../assets/kid.jpg';
import previousImg from '../assets/first.jpg';
import sampleImg from '../assets/six.jpg';
import booksImg from '../assets/jee.jpg';
import importantImg from '../assets/neet.jpg';

// Why Choose Us Icons
import icon1 from '../assets/icon1.png';
import icon2 from '../assets/icon2.png';
import icon3 from '../assets/icon3.png';
import icon4 from '../assets/icon4.png';
import icon5 from '../assets/icon5.png';
import icon6 from '../assets/icon6.png';

import whatsappIcon from "../assets/WhatsApp_icon.png"; // Adjust path if needed
import { API_BASE_URL } from "../config";

const Home = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [courseType, setCourseType] = useState(null);
  const { login, logout } = useUser()
  // Scroll to top on component load
  useEffect(() => {
    //localStorage.clear();
    //localStorage.removeItem("currentUser");
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      if (parsedUser.selectedCourse) {
        const courseKeys = Object.keys(parsedUser.selectedCourse);
        setCourseType(courseKeys);
        console.log("User courses:", courseKeys);
      }
      else {
        logout();
        setCurrentUser(null);
      }
    }
    window.scrollTo(0, 0);
    console.log(localStorage.getItem("currentUser"))

  }, []);

  useEffect(() => {
    // fetch('http://localhost:3000/checkSession',{
    // fetch(`https://studentpadmasini.onrender.com/checkSession`, {
    //  fetch(`https://padmasini-prod-api.padmasini.com/checkSession`, {
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: 'include'
    }).then(resp => resp.json())
      .then(data => {
        console.log(data)
        if (data.loggedIn === true) {
          login(data.user)
          //localStorage.clear();
          //console.log(localStorage.getItem('currentUser'))
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          //  logout(localStorage.getItem('currentUser'))
          console.log(localStorage.getItem('currentUser'))
          //onsole.log(currentUser)
        }
        if (data.loggedIn === false) {
          console.log('it came here before seeing user')
          const existingUser = localStorage.getItem('currentUser')
          if (existingUser) {
            console.log('it came here and deleted the user')
            // localStorage.removeItem("currentUser");
            //localStorage.removeItem("jeeSubjectCompletion");
            //localStorage.removeItem("currentClassJee");
            localStorage.clear(); // Clear all local storage
            logout();
            // setCoursesOpen(false);
            // setUserDropdownOpen(false);
            navigate("/login");
          }
        }
      }).catch(console.error)

  }, [])
  const handleLearnMore = (selectedCourseType) => {
    if (currentUser && localStorage.getItem("currentUser")) {
      console.log("Selected:", selectedCourseType);

      if (selectedCourseType === "JEE") {
        navigate("/JEE");
      } else if (selectedCourseType === "NEET") {
        navigate("/NEET");
      } else {
        navigate("/register"); // fallback
      }
    } else {
      navigate("/register");
    }
  };

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      setMessages([...messages, { sender: "user", text: userMessage }]);
      setUserMessage("");
      // Simulate AI response after user sends a message
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "ai", text: "I'm here to help! How can I assist you today?" },
        ]);
      }, 1000);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="head">
          <img src={headImage} alt="NEET Preparation" className="head-image" />
          <div className="head-content">
            <p className="head-text">
              PREPARE STUDENTS TODAY FOR THE CHALLENGES OF TOMORROW
            </p>
            <p className="sub-text">
              It is a powerful learning app designed to help aspiring students crack any competitive exam like NEET, JEE with ease. With expert-curated study materials, mock tests, and AI-driven personalized learning, we ensure you stay ahead in your preparation.
            </p>
            {/* <button
              className="course-button"
              onClick={() => {
                const section = document.getElementById("course-section");
                if (section) {
                  section.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Course
            </button> */}
            <button className="explore-btn">
              Learn More
            </button>

          </div>
        </div>
      </div>

      {/* Study Materials Section */}
      <div className="study-materials">
        <h2 id="course-section">Course</h2>
        <div className="tabs-wrapper">
          <button
            className="scroll-left"
            onClick={() => {
              document.getElementById("tabScroll").scrollBy({ left: -300, behavior: "smooth" });
            }}
          >
            &lt;
          </button>

          <div className="tabs-container" id="tabScroll">
            {[
              {
                courseType: "JEE",
                title: "JEE Prep Material",
                range: "JEE Exam",
                tags: ["Reference", "Advanced", "Textbooks"],
                img: booksImg
              },
              {
                courseType: "NEET",
                title: "NEET Ready Papers",
                range: "NEET Exam",
                tags: ["Mock Tests", "Practice", "Important"],
                img: importantImg
              }
            ].map((card, index) => {
              const canShow =
                !currentUser || // show all if no user
                (Array.isArray(courseType) && courseType.some(c => c === card.courseType));

              if (!canShow) return null;

              return (
                <div key={index} className="tab-card updated-card">
                  <div className="card-header">
                    <span className="class-range">{card.range}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <div className="tags">
                    {card.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                  <img className="card-image" src={card.img} alt={card.title} />
                  <button
                    className="explore-btn"
                    onClick={() => handleLearnMore(card.courseType)}
                  >
                    Learn More
                  </button>
                </div>
              );
            })}


          </div>

          <button
            className="scroll-right"
            onClick={() => {
              document.getElementById("tabScroll").scrollBy({ left: 300, behavior: "smooth" });
            }}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <h2 className="heading">Why Choose Us</h2>
        <p className="why">
          An advanced AI-powered learning app designed to boost your exam preparation.
          It offers personalized study plans, expert-curated materials, and smart analytics to help students learn faster and smarter. Perfect for NEET, JEE, and school exams.
        </p>
        <div className="circle-layout">
          <div className="center-logo">
            <img src={logo} alt="EduGrow" />
          </div>

          <div className="circle-feature top">
            <img src={icon1} alt="Mobile App" />
            <h4>Mobile App</h4>
            <p>Learn from anywhere at your convenience</p>
          </div>

          <div className="circle-feature top-right">
            <img src={icon2} alt="Intelligent Tutoring System" />
            <h4>Intelligent Tutoring System</h4>
            <p>ITS leverage AI to provide personalised guidance and support, mimicking one-on-one human tutoring</p>
          </div>

          <div className="circle-feature bottom-right">
            <img src={icon3} alt="Personalised Learning" />
            <h4>Personalised Learning</h4>
            <p>Students can typically pause, rewind, and rewatch sections of the lecture as needed, aiding comprehension and retention.</p>
          </div>

          <div className="circle-feature bottom">
            <img src={icon4} alt="Budget Friendly" />
            <h4>Budget Friendly</h4>
            <p>Get quality learning at an affordable price. Our app offers top-notch educational content and features.</p>
          </div>

          <div className="circle-feature bottom-left">
            <img src={icon5} alt="Mock Test" />
            <h4>Mock Test</h4>
            <p>Practice with real exam-style questions to boost your confidence and improve performance.</p>
          </div>

          <div className="circle-feature top-left">
            <img src={icon6} alt="24/7 Support" />
            <h4>24/7 Support</h4>
            <p>Get help anytime with our round-the-clock support for all your learning needs.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <div className="faq">
        <h2>Frequently Asked Questions ❓</h2>
        <details>
          <summary>How does AI-learning work?</summary>
          <p>Our AI tracks your progress and provides personalized recommendations.</p>
        </details>
        <details>
          <summary>Are the mock tests similar to actual NEET papers?</summary>
          <p>Yes! Our mock tests are designed to replicate real NEET exams.</p>
        </details>
        <details>
          <summary>Is there a mobile app available?</summary>
          <p>Yes, our mobile app is available on Play Store and App Store.</p>
        </details>
      </div>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/8248791389"
        className="whatsapp-chat-button"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <img
          src={whatsappIcon}
          alt="WhatsApp"
          className="whatsapp-icon"
        />
        <span>Chat with us on whatsapp</span>
      </a>

      {/* 24/7 AI Bot Label */}
      <div className="ai-status-label" onClick={toggleChat}>
        <span className="ai-icon">🤖</span>
        <span className="ai-text">I'm online 24/7</span>
      </div>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>AI Bot</h3>
            <button onClick={toggleChat} className="close-chat-btn">X</button>
          </div>
          <div className="chat-body">
            <div className="chat-intro">
              <p>Hi! I'm your AI assistant. How can I help you today?</p>
            </div>
            {/* Chat Messages */}
            <div className="messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="chat-footer">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
