import React, { useState } from "react";
import { db } from "../firebase-config.jsx"; // Make sure this path is correct
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const LoginModal = ({ show, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!username || !email || !password || !confirmPassword) {
          setError("Please fill all fields.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Check if username exists
        const userQuery = query(
          collection(db, "user_table"),
          where("username", "==", username)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          setError("Username already exists.");
          setLoading(false);
          return;
        }

        // Check if email exists
        const emailQuery = query(
          collection(db, "user_table"),
          where("email", "==", email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          setError("Email already registered.");
          setLoading(false);
          return;
        }

        await addDoc(collection(db, "user_table"), {
          username,
          email,
          password, // Hash in production!
          createdAt: new Date(),
        });

        setSuccess("Registration successful! Please login.");
        setIsRegister(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        if (!username || !password) {
          setError("Please enter username and password.");
          setLoading(false);
          return;
        }

        const loginQuery = query(
          collection(db, "user_table"),
          where("username", "==", username),
          where("password", "==", password)
        );
        const loginSnapshot = await getDocs(loginQuery);

        if (loginSnapshot.empty) {
          setError("Invalid username or password.");
        } else {
          const userData = loginSnapshot.docs[0].data();
          onLoginSuccess(userData);
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
          {isRegister && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
          {isRegister && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            />
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white shadow ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading ? "Processing..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            className="text-green-600 cursor-pointer font-semibold"
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
