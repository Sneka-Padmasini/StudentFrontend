// Courses.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Courses.css";
import { useUser } from "../components/UserContext";

// Images for NEET/JEE
import booksImg from '../assets/jee.jpg';
import importantImg from '../assets/neet.jpg';

const Courses = () => {
    const navigate = useNavigate();
    const { currentUser } = useUser();
    const [enrolledCourses, setEnrolledCourses] = useState([]);

    useEffect(() => {
        if (currentUser && currentUser.courseName) {
            setEnrolledCourses(currentUser.courseName.split(",").map(c => c.trim()));
        }
    }, [currentUser]);

    const courses = [
        {
            type: "NEET",
            title: "NEET",
            description: "Prepare effectively for NEET with guided study plans, practice papers, and interactive learning materials. Covers Physics, Chemistry, and Biology with detailed NCERT solutions, mock tests, and important questions to help you excel.",
            img: importantImg
        },
        {
            type: "JEE",
            title: "JEE",
            description: "Comprehensive learning for JEE aspirants with NCERT concepts, previous year questions, mock tests, and exam strategies. Covers Physics, Chemistry, and Mathematics with advanced practice and personalized guidance.",
            img: booksImg
        }
    ];

    const handleLearnMore = (courseType) => {
        if (!currentUser) {
            navigate("/register");
        } else {
            if (courseType === "JEE") navigate("/JEE");
            if (courseType === "NEET") navigate("/NEET");
        }
    };

    return (
        <div className="courses-page">

            {/* Hero Section */}
            <section className="courses-hero">
                <h1>Empower Your Learning Journey</h1>
                <p>Expert-curated courses for JEE & NEET with personalized study plans, AI guidance, and extensive practice material.</p>
                <button onClick={() => document.getElementById("courses-overview").scrollIntoView({ behavior: "smooth" })}>Explore Courses</button>
            </section>

            {/* Courses Overview with Zig-Zag Layout */}
            <section className="courses-overview" id="courses-overview">
                {courses.map((course, index) => {
                    const showCourse = !currentUser || enrolledCourses.includes(course.type);
                    if (!showCourse) return null;

                    const isEven = index % 2 === 0;

                    return (
                        <div key={course.type} className={`course-section ${isEven ? "normal" : "reverse"}`}>
                            <div className="course-image-wrapper">
                                <img src={course.img} alt={course.title} className="course-image" />
                            </div>
                            <div className="course-content-wrapper">
                                <h2 className="course-title">{course.title}</h2>
                                <p>{course.description}</p>
                                <button className="learn-btn" onClick={() => handleLearnMore(course.type)}>Learn More</button>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Platform Features */}
            <section className="courses-features">
                <h2 className="section-heading">Why Choose Our Courses?</h2>
                <div className="features-grid">
                    <div className="feature-card">📚 Comprehensive Study Material</div>
                    <div className="feature-card">📝 Mock Tests & Assessments</div>
                    <div className="feature-card">🤖 AI-Powered Personalized Guidance</div>
                    <div className="feature-card">🎯 Targeted Exam Strategies</div>
                    <div className="feature-card">⏱️ Time Management Techniques</div>
                    <div className="feature-card">💡 Doubt Resolution & Mentorship</div>
                </div>
            </section>

            {/* Call To Action */}
            <section className="courses-cta">
                <h2 className="section-heading">Ready to Start Your Learning Journey?</h2>
                <div className="cta-wrapper">
                    <button onClick={() => navigate("/register")}>Enroll Now</button>
                </div>
            </section>

        </div>
    );
};

export default Courses;