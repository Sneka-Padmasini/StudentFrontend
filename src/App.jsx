// App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import Registration from "./pages/Registration";
import ContactUs from "./pages/ContactUs";
import Terms from "./pages/terms";
import ResetPassword from "./pages/ResetPassword";
import NEET from "./NEET/NEET";
import NeetLearn from './NEET/NeetLearn';
import NeetExplanation from './NEET/NeetExplanation';
import NeetQuiz from './NEET/NeetQuiz';
// import JEE from "./JEE/JEE";
// import JeeLearn from './JEE/JeeLearn';
// import JeeExplanation from './JEE/JeeExplanation';
// import JeeQuiz from './JEE/JeeQuiz';
import PadmasiniChat from "./components/PadmasiniChat";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./components/About";
import Courses from "./pages/Courses";
import ScrollToTop from "./components/ScrollToTop";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/neet" element={<NEET />} />
        <Route path="/NeetLearn" element={<ProtectedRoute allowedCourse="NEET" element={<NeetLearn />} />} />
        <Route path="/NeetExplanation" element={<ProtectedRoute allowedCourse="NEET" element={<NeetExplanation />} />} />
        <Route path="/NeetQuiz" element={<ProtectedRoute allowedCourse="NEET" element={<NeetQuiz />} />} />
        {/* <Route path="/jee" element={<ProtectedRoute allowedCourse="JEE" element={<JEE />} />} />
        <Route path="/JeeLearn" element={<ProtectedRoute allowedCourse="JEE" element={<JeeLearn />} />} />
        <Route path="/JeeExplanation" element={<ProtectedRoute allowedCourse="JEE" element={<JeeExplanation />} />} />
        <Route path="/JeeQuiz" element={<ProtectedRoute allowedCourse="JEE" element={<JeeQuiz />} />} /> */}
        <Route path="/padmasini-chat" element={<PadmasiniChat />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;