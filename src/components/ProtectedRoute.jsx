import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedCourse }) => {
  const [redirectPath, setRedirectPath] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!user) {
      setMessage("❌ Please log in to access this page.");
      setRedirectPath("/login");
      return;
    }

    // const userCourse = user.courseName?.toUpperCase();
    // const allowed = allowedCourse.toUpperCase();

    // // ✅ Allow if registered for BOTH or the correct course
    // if (userCourse !== allowed && userCourse !== "BOTH") {
    //   setMessage(`❌ Access denied. You are registered for ${userCourse || "no course"}.`);
    //   setRedirectPath("/");
    //   return;
    // }
  }, [allowedCourse]);

  useEffect(() => {
    if (message) alert(message);
  }, [message]);

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return element;
};

export default ProtectedRoute;
