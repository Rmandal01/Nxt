"use client";

import { motion } from "framer-motion";

interface ScoreBreakdownProps {
  creativity_score: number;
  effectiveness_score: number;
  clarity_score: number;
  originality_score: number;
  total_score: number;
  feedback?: string;
}

const ScoreBar = ({ label, score, maxScore = 10, delay = 0 }: { label: string; score: number; maxScore?: number; delay?: number }) => {
  const percentage = (score / maxScore) * 100;

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          className={`h-full ${getColor(score)} rounded-full relative`}
        >
          <motion.div
            className="absolute inset-0 bg-white opacity-20"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default function ScoreBreakdown({
  creativity_score,
  effectiveness_score,
  clarity_score,
  originality_score,
  total_score,
  feedback
}: ScoreBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg"
    >
      <h3 className="text-2xl font-bold mb-6 text-center text-white">Your Score Breakdown</h3>

      <div className="mb-6">
        <ScoreBar label="Creativity" score={creativity_score} delay={0.1} />
        <ScoreBar label="Effectiveness" score={effectiveness_score} delay={0.2} />
        <ScoreBar label="Clarity" score={clarity_score} delay={0.3} />
        <ScoreBar label="Originality" score={originality_score} delay={0.4} />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="border-t border-gray-700 pt-4 mt-4"
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-white">Total Score</span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1, type: "spring", stiffness: 200 }}
            className="text-3xl font-bold text-green-400"
          >
            {total_score}/40
          </motion.span>
        </div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="bg-gray-700 p-4 rounded-lg"
          >
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Judge's Feedback</h4>
            <p className="text-sm text-gray-200">{feedback}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
