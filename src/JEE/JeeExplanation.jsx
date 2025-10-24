import React, { useState, useEffect, useRef } from 'react';
import './JeeExplanation.css';
import { FaPlay, FaPause, FaCheckCircle } from 'react-icons/fa';
import katex from 'katex';
import parse from 'html-react-parser';
import 'katex/dist/katex.min.css';

const JeeExplanation = ({
  explanation = '',
  subtopicTitle = '',
  subject = '',
  audioFileId = [],
  imageUrls = [],
  onBack,
  onMarkComplete
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [highlightedRange, setHighlightedRange] = useState({ start: 0, end: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);
  const voicesLoadedRef = useRef(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Load and set voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return;

      const indianFemale = voices.find(
        (v) =>
          (v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')) &&
          v.name.toLowerCase().includes('female')
      );
      const indianVoice = voices.find(
        (v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')
      );
      setVoice(indianFemale || indianVoice || voices[0]);
      voicesLoadedRef.current = true;
    };

    if (!voicesLoadedRef.current) {
      if (synth.onvoiceschanged !== undefined) {
        synth.addEventListener('voiceschanged', loadVoices);
      }
      loadVoices();
    }

    return () => {
      if (synth.onvoiceschanged !== undefined) {
        synth.removeEventListener('voiceschanged', loadVoices);
      }
      synth.cancel();
    };
  }, [synth]);

  useEffect(() => {
    synth.cancel();
    setIsSpeaking(false);
    setHighlightedRange({ start: 0, end: 0 });
    utteranceRef.current = null;
  }, [subtopicTitle]);

  const parseTextWithFormulas = (texts) => {
    if (!texts) return null;

    // Keep proper newlines and lists formatting
    let text = texts
      .replace(/\\\\/g, "\\") // cleanup slashes
      .replace(/\r?\n/g, "<br/>"); // handle newlines from admin textareas

    // Handle $...$ LaTeX formulas
    const TEMP_DOLLAR = "__DOLLAR__";
    const safeText = text.replace(/\\\$/g, TEMP_DOLLAR);
    const parts = safeText.split(/(\$[^$]+\$)/g);

    const renderedParts = parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        try {
          const html = katex.renderToString(latex, { throwOnError: false, output: "html" });
          return `<span>${html}</span>`;
        } catch (err) {
          return `<span style="color:red">${latex}</span>`;
        }
      } else {
        return part.replaceAll(TEMP_DOLLAR, "$");
      }
    });

    // Join everything and parse as HTML (so <ul>, <li>, <b>, <br> all work)
    const combinedHTML = renderedParts.join("");
    return parse(combinedHTML);
  };



  const handleTogglePlayPause = () => {
    const text = explanation || subtopicTitle;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      setHighlightedRange({ start: 0, end: 0 });
    } else if (text.trim()) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = rate;
      utteranceRef.current = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setHighlightedRange({ start: 0, end: 0 });
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const start = event.charIndex;
          let end = start;
          while (end < text.length && /\S/.test(text[end])) end++;
          setHighlightedRange({ start, end });
        }
      };

      synth.speak(utterance);
    }
  };

  const handleBack = () => {
    synth.cancel();
    setIsSpeaking(false);
    setHighlightedRange({ start: 0, end: 0 });
    utteranceRef.current = null;
    if (onBack) onBack();
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(`jee-completed-${subtopicTitle}`);
    setIsComplete(stored === "true");
  }, [subtopicTitle]);

  const handleMarkComplete = () => {
    setIsComplete(true);
    sessionStorage.setItem(`jee-completed-${subtopicTitle}`, "true");
    if (onMarkComplete) onMarkComplete(); // Remove "explanation" parameter
  };

  const isIntroIframe =
    subject.toLowerCase() === "physics" &&
    subtopicTitle.trim().toLowerCase() === "1.1 introduction";

  const textToDisplay = explanation || subtopicTitle;
  const { start, end } = highlightedRange;
  const before = textToDisplay.slice(0, start);
  const highlight = textToDisplay.slice(start, end);
  const after = textToDisplay.slice(end);

  return (
    <div className="explanation-container">
      <div className="explanation-content">
        <h2>{subtopicTitle}</h2>

        <div className="centered-buttons">
          <button
            onClick={handleMarkComplete}
            className={`complete-btn ${isComplete ? 'completed' : ''}`}
            disabled={isComplete}
          >
            {isComplete ? (
              <>
                Completed <FaCheckCircle className="check-icon" />
              </>
            ) : (
              'Mark as Complete'
            )}
          </button>

          {isIntroIframe ? (
            <div className="iframe-wrapper">
              <iframe
                src="https://scintillating-bienenstitch-4a86e8.netlify.app/"
                title="JEE Physics Intro"
                className="embedded-iframe"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <>

              {/* Explanation text supporting formulas + HTML */}
              <div className="explanation-text">
                {parseTextWithFormulas(explanation || "No explanation available")}
              </div>


              {/* Explanation Images */}
              {imageUrls && imageUrls.length > 0 && (
                <div className="explanation-images">
                  {imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Unit Image ${idx + 1}`}
                      style={{
                        maxWidth: "100%",
                        margin: "10px 0",
                        borderRadius: "10px",
                        display: "block",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="subject-info">
          {!isIntroIframe && (
            <div className="voice-controls-wrapper">
              <button className="voice-play-button" onClick={handleTogglePlayPause}>
                {isSpeaking ? <FaPause /> : <FaPlay />}
              </button>

              <div className="rate-control">
                <label htmlFor="rate">Speech Speed: {rate.toFixed(2)}x</label>
                <input
                  type="range"
                  id="rate"
                  min="0.25"
                  max="2"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Audio Playback */}

          {/* {audioFileId && audioFileId.length > 0 && (
            <div className="audio-files">
              {audioFileId.map((id, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <audio controls src={id}></audio>
                </div>
              ))}
            </div>
          )} */}
        </div>

        <button onClick={handleBack} className="back-btn">
          Back to Topics
        </button>
      </div>
    </div>
  );
};

export default JeeExplanation;