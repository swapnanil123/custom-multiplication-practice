import React, { useEffect, useState } from "react";
import { db } from "./../firebase-config.jsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AnalyticsModal = ({ show, onClose, username }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!username || !show) return;

    const fetchSessions = async () => {
      try {
        const q = query(
          collection(db, "sessions"),
          where("username", "==", username)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Sort by timestamp (handle Firestore timestamp object)
        data.sort((a, b) => {
          const t1 = a.timestamp?.seconds || 0;
          const t2 = b.timestamp?.seconds || 0;
          return t1 - t2;
        });

        setSessions(data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };

    fetchSessions();
  }, [username, show]);

  // Map chart data, including session 0
  const chartData = sessions.map((s, idx) => ({
    name: `Session ${idx + 1}`,
    Correct: s.correct ?? 0,
    Incorrect: s.incorrect ?? 0,
    Total: s.totalQuestions ?? 0,
  }));

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Your Progress</DialogTitle>
        </DialogHeader>

        {sessions.length === 0 ? (
          <p className="mt-4 text-gray-600">No sessions recorded yet.</p>
        ) : (
          <div className="mt-4 w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                {/* Total Questions Bar */}
                <Bar dataKey="Total" fill="#60a5fa" name="Total Questions" />
                {/* Correct and Incorrect Bars */}
                <Bar dataKey="Correct" fill="#22c55e" name="Correct" />
                <Bar dataKey="Incorrect" fill="#ef4444" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsModal;
