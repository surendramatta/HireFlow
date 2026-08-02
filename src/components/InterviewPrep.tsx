import React, { useState } from "react";
import { CandidateProfile, InterviewQuestion } from "../types";
import { 
  MessageSquareCode, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Mic, 
  MicOff, 
  Send, 
  HelpCircle, 
  ChevronRight, 
  Bot, 
  RotateCcw 
} from "lucide-react";

interface InterviewPrepProps {
  profile: CandidateProfile;
}

export const InterviewPrep: React.FC<InterviewPrepProps> = ({ profile }) => {
  const [jobTitleInput, setJobTitleInput] = useState((profile?.targetTitles || [])[0] || "Senior Full Stack Engineer");
  const [companyInput, setCompanyInput] = useState("Linear / Anthropic");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([
    {
      id: "q1",
      question: "Describe a challenging technical problem you solved in a recent project. What was the architecture, trade-offs, and final outcome?",
      type: "Behavioral & System Design",
      starTip: "Structure with Situation (project scale), Task, Action (specific tech choices in React/Node), and Result (% latency or cost improvement)."
    },
    {
      id: "q2",
      question: "How do you handle state synchronization and performance bottlenecks when building real-time collaborative web applications?",
      type: "Technical Deep-Dive",
      starTip: "Mention WebSockets, optimistic UI updates, memoization, and automated end-to-end testing."
    }
  ]);

  const [activeQuestionId, setActiveQuestionId] = useState<string>("q1");
  const [userAnswerText, setUserAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId) || questions[0];

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch("/api/ai/mock-interview-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitleInput,
          company: companyInput,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setActiveQuestionId(data.questions[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswerText.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/ai/evaluate-interview-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestion.question,
          candidateAnswer: userAnswerText,
          jobTitle: jobTitleInput,
        }),
      });
      const data = await res.json();

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === activeQuestionId
            ? {
                ...q,
                userAnswer: userAnswerText,
                feedback: data,
              }
            : q
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate speech-to-text transcript arrival
      setTimeout(() => {
        setUserAnswerText((prev) =>
          prev
            ? `${prev} In my previous team, we faced high rendering latency. I optimized React re-renders and reduced bundle sizes by 35%.`
            : "In my previous role, we engineered a high-throughput micro-frontend app serving 200k monthly active users. I led the migration from legacy client rendering to server-side Next.js routes, improving page load speeds by 42% and raising conversion rates."
        );
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <MessageSquareCode className="w-5 h-5 text-indigo-400" />
            <span>AI Mock Interviewer & Answer Coach</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic technical and behavioral interviews, speak or type your answers, and receive instant Gemini STAR feedback.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateQuestions}
            disabled={isGeneratingQuestions}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingQuestions ? "animate-spin" : ""}`} />
            <span>{isGeneratingQuestions ? "Generating..." : "Generate Custom Questions"}</span>
          </button>
        </div>
      </div>

      {/* Split View: Questions Sidebar + Answer Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Questions Selector (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="space-y-3 text-xs pb-3 border-b border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Role</label>
              <input
                type="text"
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Company</label>
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">Question Set ({questions.length})</span>
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQuestionId(q.id);
                  setUserAnswerText(q.userAnswer || "");
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition space-y-1.5 ${
                  activeQuestionId === q.id
                    ? "bg-indigo-950/40 border-indigo-500 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Q{idx + 1}. {q.type}</span>
                  {q.feedback && <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">{q.feedback.score}%</span>}
                </div>
                <p className="line-clamp-2 text-slate-300 text-[11px]">{q.question}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Answer Console & Feedback (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeQuestion && (
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
              {/* Active Question Title */}
              <div className="space-y-2 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                    {activeQuestion.type}
                  </span>
                  <span className="text-xs text-slate-400">Targeting {jobTitleInput}</span>
                </div>
                <h2 className="text-base font-extrabold text-white leading-snug">
                  {activeQuestion.question}
                </h2>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>STAR Method Tip:</strong> {activeQuestion.starTip}</span>
                </div>
              </div>

              {/* Answer Input Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">Your Answer Response</label>
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isRecording
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{isRecording ? "Listening..." : "Dictate Answer"}</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={userAnswerText}
                  onChange={(e) => setUserAnswerText(e.target.value)}
                  placeholder="Type your response here or click 'Dictate Answer'..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={isEvaluating || !userAnswerText.trim()}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                    <span>{isEvaluating ? "Evaluating with Gemini..." : "Submit Answer for AI Grading"}</span>
                  </button>
                </div>
              </div>

              {/* AI Feedback Output */}
              {activeQuestion.feedback && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center space-x-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Gemini Evaluation & STAR Grade</span>
                    </span>
                    <div className="flex space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold">
                        Score: {activeQuestion.feedback.score}%
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                        STAR Framework: {activeQuestion.feedback.starFrameworkScore}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-200">Feedback Notes:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {activeQuestion.feedback.feedback.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2 text-xs">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>Polished Model Response (STAR Structure)</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed italic">
                      "{activeQuestion.feedback.improvedResponse}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
