import React, { useState, useRef, useEffect } from 'react';

// ✅ FIXED: Uses environment variable instead of hardcoded localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Welcome to your AI Mock Interview. I am ready when you are. Please introduce yourself and tell me about your background.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewActive, setInterviewActive] = useState(true);
  const chatEndRef = useRef(null);

  // ✅ NOTE: Replace this with the actual logged-in user's email from your auth state
  // e.g. if using props: const userEmail = props.email;
  // If Frontend.js is standalone, you'll need to pass email in somehow.
  const userEmail = "user@example.com"; // ← update this to use real auth email

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // ✅ FIXED: was 'http://localhost:8000/api/chat'
      // ✅ FIXED: now sends correct 'email' field instead of unused 'interview_context'
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          user_message: input,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Network Error. Ensure your Python backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f7f6', color: '#333' }}>
      
      {/* LEFT SIDEBAR */}
      <div style={{ width: '300px', backgroundColor: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          Agentic AI Platform
        </h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>Session Details</h4>
          <p><strong>Role:</strong> SDE Intern</p>
          <p><strong>Difficulty:</strong> Medium</p>
          <p><strong>Focus:</strong> DSA & System Design</p>
        </div>

        <div style={{ backgroundColor: '#000', height: '200px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
            <span style={{ color: '#64748b' }}>User Camera Feed</span>
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px', backgroundColor: interviewActive ? '#22c55e' : '#ef4444', borderRadius: '50%' }}></div>
        </div>

        <button 
          onClick={() => setInterviewActive(!interviewActive)}
          style={{ padding: '12px', backgroundColor: interviewActive ? '#ef4444' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {interviewActive ? 'End Interview' : 'Start Interview'}
        </button>
      </div>

      {/* RIGHT MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Live Interview Session</h2>
          <span style={{ backgroundColor: '#e2e8f0', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>Time Elapsed: 14:02</span>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '20px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '20px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
              <div style={{ 
                maxWidth: '70%', 
                padding: '15px', 
                borderRadius: '12px',
                backgroundColor: msg.sender === 'user' ? '#3b82f6' : '#f1f5f9',
                color: msg.sender === 'user' ? 'white' : '#1e293b',
                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
                lineHeight: '1.5'
              }}>
                <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', opacity: 0.8 }}>
                  {msg.sender === 'user' ? 'You' : 'AI Interviewer'}
                </strong>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
               <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '12px', color: '#64748b' }}>
                 Analyzing response and generating next question...
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your answer or speak into the microphone..."
            disabled={!interviewActive}
            style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !interviewActive || !input.trim()}
            style={{ padding: '0 30px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'background 0.2s' }}
          >
            Submit Answer
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;