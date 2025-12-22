import React, { useState, useEffect, useRef } from 'react';
import './NeetExplanation.css';
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import katex from 'katex';
import parse from 'html-react-parser';
import 'katex/dist/katex.min.css';

const NeetExplanation = ({
  explanation = '',
  subtopicTitle = '',
  subject = '',
  audioFileId = [],
  imageUrls = [],
  videoUrl = '',
  onBack,
  onMarkComplete,
  isAlreadyComplete,
  onNext,
  onPrevious
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [highlightedRange, setHighlightedRange] = useState({ start: 0, end: 0 });
  const [isComplete, setIsComplete] = useState(isAlreadyComplete);

  const synth = window.speechSynthesis;
  const utteranceRef = useRef(null);
  const voicesLoadedRef = useRef(false);

  // ✅ SCROLL FIX: Force scroll to top on mount
  useEffect(() => {
    // Scroll window
    window.scrollTo(0, 0);

    // Scroll the container div
    const container = document.querySelector('.explanation-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [subtopicTitle]); // Trigger whenever title changes

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
          while (end < text.length && /\S/.test(text[end])) {
            end++;
          }
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
    setIsComplete(isAlreadyComplete);
  }, [isAlreadyComplete, subtopicTitle]);

  const handleMarkComplete = () => {
    setIsComplete(true);
    if (onMarkComplete) onMarkComplete();
  };

  const parseTextWithFormulas = (texts) => {
    if (!texts) return null;

    // 1. Clean up input & ✅ FIX 1: Handle Bold Text (**text**)
    let text = texts
      .replace(/\\\\/g, "\\")
      .replace(/\t/g, "    ")
      .replace(/<\s*br\s*\/?\s*>/gi, "<br/>")
      .replace(/\r?\n/g, "<br/>")
      .replace(/p<d<f\./gi, "") // Remove PDF artifacts
      .replace(/<d<f\./gi, "")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"); // 🟢 Converts **Bold** to <b>Bold</b>

    const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
    const parts = text.split(regex);

    const renderedParts = parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const latex = part.slice(2, -2);
        try {
          const html = katex.renderToString(latex, { throwOnError: false, output: "html", displayMode: true });
          return `<div key="${index}" class="latex-block">${html}</div>`;
        } catch (err) { return `<span style="color:red">${latex}</span>`; }
      }
      else if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        try {
          const html = katex.renderToString(latex, { throwOnError: false, output: "html", displayMode: false });
          return `<span key="${index}">${html}</span>`;
        } catch (err) { return `<span style="color:red">${latex}</span>`; }
      }
      else {
        return part;
      }
    });

    const combinedHTML = renderedParts.join("");
    try {
      return parse(combinedHTML);
    } catch (error) {
      console.error("HTML Parsing Failed", texts);
      return <span>{text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>;
    }
  };

  // ✅ FIX 2: Logic to determine if "No explanation available" should be shown
  const hasMedia = (imageUrls && imageUrls.length > 0) || (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== "" && videoUrl !== "null");
  const hasExplanation = explanation && explanation.trim().length > 0;

  return (
    <div className="explanation-wrapper-inner">

      {/* 1. WRAP CONTENT IN SCROLL AREA */}
      <div className="explanation-scroll-area">
        <div className="explanation-content">
          <h2>{subtopicTitle}</h2>

          {/* ... existing video logic ... */}
          {videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== "" && videoUrl !== "null" && (
            <div className="ai-video-container">
              {/* ... video code ... */}
              <h5>AI Generated Video</h5>
              <video key={videoUrl} controls>
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <div className="explanation-text-with-controls">
            {/* ... existing text/image logic ... */}
            {hasExplanation ? (
              <div className="explanation-text">
                {parseTextWithFormulas(explanation)}
              </div>
            ) : (
              !hasMedia && (
                <div className="explanation-text" style={{ fontStyle: "italic", color: "#666" }}>
                  No explanation available.
                </div>
              )
            )}
            {/* Display all images */}
            {imageUrls && imageUrls.length > 0 && (
              <div className="explanation-images">
                {/* ... existing image map ... */}
                {imageUrls.map((url, index) => (
                  // <img key={index} src={url} alt={`Unit Image ${index + 1}`} style={{ maxWidth: "100%", margin: "10px 0", borderRadius: "10px", display: "block" }} />
                  <img key={index} src={url} alt={`Unit Image ${index + 1}`} className="explanation-img-item" />
                ))}
              </div>
            )}
          </div>


        </div>
      </div>
      {/* END OF SCROLL AREA */}

      {/* 2. BUTTONS ARE NOW OUTSIDE THE SCROLL AREA (FIXED AT BOTTOM) */}
      <div className="explanation-footer">
        <div className="nav-container">
          <button onClick={onPrevious} className="nav-btn prev-btn">
            <FaArrowLeft /> Previous
          </button>

          <button
            onClick={() => { if (onNext) onNext(); }}
            className="nav-btn next-btn"
          >
            {isComplete ? "Next" : "Complete"} <FaArrowRight />
          </button>
        </div>

        <button onClick={handleBack} className="back-btn">
          Back to Topics
        </button>
      </div>

    </div>
  );
  //   <div className="explanation-container">
  //     <div className="explanation-content">
  //       <h2>{subtopicTitle}</h2>

  //       <div className="explanation-text-with-controls">

  //         {/* Only show text div if there is text */}
  //         {hasExplanation ? (
  //           <div className="explanation-text">
  //             {parseTextWithFormulas(explanation)}
  //           </div>
  //         ) : (
  //           /* Only show placeholder if NO text AND NO media */
  //           !hasMedia && (
  //             <div className="explanation-text" style={{ fontStyle: "italic", color: "#666" }}>
  //               No explanation available.
  //             </div>
  //           )
  //         )}

  //         {/* Display all images */}
  //         {imageUrls && imageUrls.length > 0 && (
  //           <div className="explanation-images">
  //             {imageUrls.map((url, index) => (
  //               <img
  //                 key={index}
  //                 src={url}
  //                 alt={`Unit Image ${index + 1}`}
  //                 style={{
  //                   maxWidth: "100%",
  //                   margin: "10px 0",
  //                   borderRadius: "10px",
  //                   display: "block",
  //                 }}
  //               />
  //             ))}
  //           </div>
  //         )}
  //       </div>

  //       {/* AI Generated Video */}
  //       {videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== "" && videoUrl !== "null" && (
  //         <div className="ai-video-container">
  //           <h5>AI Generated Video</h5>
  //           <video key={videoUrl} width="100%" controls>
  //             <source src={videoUrl} type="video/mp4" />
  //             Your browser does not support the video tag.
  //           </video>
  //         </div>
  //       )}

  //       <div className="nav-container">
  //         <button onClick={onPrevious} className="nav-btn prev-btn">
  //           <FaArrowLeft /> Previous
  //         </button>

  //         <button
  //           onClick={() => { if (onNext) onNext(); }}
  //           className="nav-btn next-btn"
  //         >
  //           {isComplete ? "Next" : "Complete"} <FaArrowRight />
  //         </button>
  //       </div>

  //       <button onClick={handleBack} className="back-btn">
  //         Back to Topics
  //       </button>
  //     </div>
  //   </div>
  // );
};

export default NeetExplanation;