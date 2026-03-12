import React, { useState, useRef, useEffect } from 'react';

// ✅ FIXED: All API calls now use environment variable instead of hardcoded localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const defaultWelcomeMessage = { sender: 'ai', text: "Welcome to your SkillSync AI Mock Interview. I am ready when you are. Please introduce yourself and let's begin." };
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false); 
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', college: '', job_preference: '', new_password: '' });
  const [profileUpdateMsg, setProfileUpdateMsg] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);

  const chatEndRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({ name: currentUser.name || '', phone: currentUser.phone || '', college: currentUser.college || '', job_preference: currentUser.job_preference || '', new_password: '' });
    }
  }, [currentUser]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : { name: authForm.name, email: authForm.email, password: authForm.password };

    try {
      // ✅ FIXED: was 'http://localhost:8000${endpoint}'
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) setCurrentUser(data.user); 
      else setAuthError(data.detail || "Authentication failed");
    } catch (err) { setAuthError("Network error. Is the Python backend running?"); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthForm({ name: '', email: '', password: '' });
    setActiveTab('dashboard');
    setInterviewActive(false);
    setResumeFile(null);
    setMessages([defaultWelcomeMessage]);
    setSelectedReport(null);
    window.speechSynthesis.cancel(); 
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileUpdateMsg('Updating...');
    try {
      // ✅ FIXED: was 'http://localhost:8000/api/update_profile'
      const response = await fetch(`${API_URL}/api/update_profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUser.email, ...profileForm }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        setProfileUpdateMsg('Profile Updated Successfully!');
        setTimeout(() => { setProfileUpdateMsg(''); setActiveTab('dashboard'); }, 1500);
      } else setProfileUpdateMsg('Error: ' + data.detail);
    } catch (err) { setProfileUpdateMsg('Network error.'); }
  };

  const handleResumeUpload = async (e) => { 
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file.name);
      setIsParsing(true); 
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", currentUser.email); 

      try {
        // ✅ FIXED: was 'http://localhost:8000/api/upload_resume'
        const response = await fetch(`${API_URL}/api/upload_resume`, { method: 'POST', body: formData });
        if (!response.ok) setResumeFile("Error parsing document");
      } catch (err) { setResumeFile("Network Error"); } finally { setIsParsing(false); }
    } 
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      if (interviewActive && currentUser) {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); if (videoRef.current) videoRef.current.srcObject = stream; } catch (err) {}
      } else {
        if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; }
        window.speechSynthesis.cancel(); 
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [interviewActive, currentUser]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.lang.startsWith('en-') && (voice.name.includes('Google') || voice.name.includes('Female') || voice.name.includes('Natural')));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // ✅ FIXED: was 'http://localhost:8000/api/chat'
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, user_message: input }), 
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
        if (interviewActive) speakText(data.reply);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Network Error.' }]);
    } finally { setIsLoading(false); }
  };

  const handleEndInterview = async () => {
    setInterviewActive(false);
    window.speechSynthesis.cancel();
    if (messages.length <= 1) { setMessages([defaultWelcomeMessage]); return; }

    setIsAnalyzing(true);
    const transcript = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');

    try {
        // ✅ FIXED: was 'http://localhost:8000/api/analyze_interview'
        const response = await fetch(`${API_URL}/api/analyze_interview`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUser.email, transcript })
        });
        const data = await response.json();
        if (response.ok) {
            setCurrentUser({...currentUser, reports: data.reports}); 
            setShowReportPopup(true); 
            setMessages([defaultWelcomeMessage]); 
        } else {
            alert("Analysis failed. The AI API might be rate-limited. Try again soon.");
        }
    } catch (err) { 
        console.error("Failed to analyze", err); 
        alert("Network Error: Could not reach the analysis server.");
    } finally { setIsAnalyzing(false); }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

  const sharedStyles = `
    .card-3d { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease; box-shadow: 0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05); }
    .card-3d:hover { transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1); border-color: #334155 !important; }
    .btn-3d-blue { background-color: #0284C7; color: white; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 0 #0369A1, 0 6px 15px rgba(0,0,0,0.4); }
    .btn-3d-blue:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 #0369A1, 0 2px 5px rgba(0,0,0,0.4); }
    .btn-3d-red { background-color: #EF4444; color: white; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 0 #B91C1C, 0 6px 15px rgba(0,0,0,0.4); }
    .btn-3d-red:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 #B91C1C, 0 2px 5px rgba(0,0,0,0.4); }
    .btn-3d-green { background-color: #10B981; color: white; border: none; border-radius: 10px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 0 #059669, 0 6px 15px rgba(0,0,0,0.4); }
    .btn-3d-green:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 #059669, 0 2px 5px rgba(0,0,0,0.4); }
    .btn-3d-dark { background-color: #1E293B; color: #F8FAFC; border: 1px solid #334155; border-radius: 20px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 3px 0 #0F172A, 0 5px 10px rgba(0,0,0,0.3); }
    .btn-3d-dark:active { transform: translateY(3px); box-shadow: 0 0 0 #0F172A, 0 2px 4px rgba(0,0,0,0.3); }
    .input-3d { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid #334155; background-color: rgba(15, 23, 42, 0.8); color: #F8FAFC; font-size: 1rem; outline: none; transition: all 0.3s ease; box-shadow: inset 0 3px 6px rgba(0,0,0,0.4); margin-bottom: 20px; box-sizing: border-box; }
    .input-3d:focus { border-color: #0284C7; box-shadow: inset 0 3px 6px rgba(0,0,0,0.6), 0 0 10px rgba(2, 132, 199, 0.3); }
    .nav-tab-3d { transition: all 0.2s ease; } .nav-tab-3d:hover { transform: translateX(5px); } .nav-tab-3d:active { transform: scale(0.96) translateX(2px); box-shadow: inset 0 3px 6px rgba(0,0,0,0.4); }
    .input-disabled { background-color: rgba(30, 41, 59, 0.5); color: #64748B; cursor: not-allowed; }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); } 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); } }
    .parsing-pulse { animation: pulse-glow 1.5s infinite; border-radius: 8px; border: 1px solid #38BDF8 !important; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
    .modal-content { background: #0F172A; padding: 40px; border-radius: 20px; border: 1px solid #38BDF8; box-shadow: 0 0 30px rgba(56,189,248,0.2); text-align: center; max-width: 400px; animation: fadeUp 0.3s ease forwards; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .bar-container { width: 100%; background: #1E293B; border-radius: 8px; height: 16px; overflow: hidden; margin-top: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #0284C7, #38BDF8); border-radius: 8px; transition: width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  `;

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1121', fontFamily: "'Inter', sans-serif" }}>
        <style>{sharedStyles}</style>
        <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '40px', borderRadius: '20px', width: '400px', border: '1px solid #1E293B', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(2,132,199,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38BDF8', marginBottom: '10px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}><span style={{ fontSize: '2.2rem' }}>⚡</span> SkillSync AI</h2>
          <p style={{ color: '#94A3B8', textAlign: 'center', marginBottom: '30px' }}>{authMode === 'login' ? 'Authenticate to access your dashboard' : 'Create your neural profile'}</p>
          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && <input type="text" placeholder="Full Name" className="input-3d" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} />}
            <input type="email" placeholder="Email Address" className="input-3d" required value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} />
            <input type="password" placeholder="Password" className="input-3d" required value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />
            {authError && <p style={{ color: '#EF4444', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" className="btn-3d-blue" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>{authMode === 'login' ? 'Initialize Login' : 'Register Profile'}</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
              {authMode === 'login' ? "Don't have a profile? " : "Already registered? "}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'underline' }}>{authMode === 'login' ? 'Register Here' : 'Login Here'}</button>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !currentUser.phone || !currentUser.college || !currentUser.job_preference;

  const SkillBar = ({ label, score }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', fontSize: '0.95rem', fontWeight: 'bold' }}>
        <span>{label}</span><span>{score || 0}%</span>
      </div>
      <div className="bar-container"><div className="bar-fill" style={{ width: `${score || 0}%` }}></div></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: '#0B1121', color: '#F8FAFC' }}>
      <style>{sharedStyles}</style>

      {(isAnalyzing || showReportPopup) && (
        <div className="modal-overlay">
            <div className="modal-content">
                {isAnalyzing ? (
                    <>
                        <div className="parsing-pulse" style={{width:'60px', height:'60px', borderRadius:'50%', background:'#38BDF8', margin:'0 auto 25px'}}></div>
                        <h2 style={{color: '#F8FAFC', margin: '0 0 10px 0'}}>Analyzing Performance...</h2>
                        <p style={{color: '#94A3B8'}}>Generating your detailed feedback report based on the transcript.</p>
                    </>
                ) : (
                    <>
                        <div style={{fontSize:'3.5rem', marginBottom:'15px', textShadow:'0 4px 8px rgba(0,0,0,0.5)'}}>📊</div>
                        <h2 style={{color: '#F8FAFC', margin: '0 0 10px 0'}}>Interview Analyzed!</h2>
                        <p style={{color: '#94A3B8', marginBottom: '25px'}}>Your performance report has been generated successfully.</p>
                        <button className="btn-3d-blue" style={{padding: '12px 24px', fontSize: '1.1rem', fontWeight: 'bold'}} onClick={() => { setShowReportPopup(false); setActiveTab('analytics'); }}>
                           View Analytics
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#0F172A', padding: '20px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '5px 0 15px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38BDF8', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}><span style={{ fontSize: '1.8rem' }}>⚡</span> SkillSync AI</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {['dashboard', 'interview', 'profile', 'analytics'].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedReport(null); }} className="nav-tab-3d" style={{ padding: '12px 15px', textAlign: 'left', backgroundColor: activeTab === tab ? '#1E293B' : 'transparent', color: activeTab === tab ? '#38BDF8' : '#94A3B8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === tab ? '600' : '400', textTransform: 'capitalize' }}>
              {tab} {tab === 'profile' && isProfileIncomplete && <span style={{ color: '#EF4444', float: 'right' }}>●</span>}
            </button>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
             <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{getInitials(currentUser.name)}</div>
             <div style={{ overflow: 'hidden' }}><p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser.name}</p><p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>Active Session</p></div>
          </div>
          <button onClick={handleLogout} className="btn-3d-dark" style={{ width: '100%', padding: '10px', color: '#EF4444', fontWeight: 'bold' }}>Logout User</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '10px 30px' }}>
            <div style={{ height: '140px', background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)', borderRadius: '12px 12px 0 0', position: 'relative', boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.2)' }}></div>
            <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '20px 30px 30px', borderRadius: '0 0 12px 12px', border: '1px solid #1E293B', borderTop: 'none', position: 'relative', marginBottom: '25px' }}>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#1E293B', borderRadius: '50%', position: 'absolute', top: '-60px', left: '30px', border: '5px solid #0B1121', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#F8FAFC', boxShadow: '0 8px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)' }}>{getInitials(currentUser.name)}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setActiveTab('profile')} className={isProfileIncomplete ? "btn-3d-green" : "btn-3d-dark"} style={{ padding: '8px 16px', fontWeight: 'bold' }}>{isProfileIncomplete ? "Complete Profile" : "Edit Profile"}</button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: '#F8FAFC', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{currentUser.name}</h1>
                <p style={{ color: '#E2E8F0', fontSize: '1.1rem', margin: '0 0 8px 0', fontWeight: '400' }}>{currentUser.job_preference || 'Candidate'} | SkillSync AI Platform</p>
                <div style={{ display: 'flex', gap: '15px', color: '#94A3B8', fontSize: '0.9rem' }}>
                  <span>📧 {currentUser.email}</span>{currentUser.college && <span>🎓 {currentUser.college}</span>}{currentUser.phone && <span>📞 {currentUser.phone}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '25px' }}>
               <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                 <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '25px', borderRadius: '12px', border: '1px solid #1E293B' }}>
                   <h3 style={{ fontSize: '1.2rem', margin: '0 0 15px 0', color: '#F8FAFC' }}>Platform Status</h3>
                   {isProfileIncomplete ? (
                     <p style={{ color: '#F59E0B', lineHeight: '1.7', margin: 0, padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #F59E0B', borderRadius: '4px' }}><strong>Action Required:</strong> Please click "Complete Profile" above to fill in your College and Job Preferences before initializing a session.</p>
                   ) : (
                     <p style={{ color: '#94A3B8', lineHeight: '1.7', margin: 0 }}>Profile complete. Head over to the "Interview" tab to initialize your agentic session, or upload your latest resume to build your context blueprint.</p>
                   )}
                 </div>
               </div>

               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                 <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '25px', borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 15px 0', color: '#F8FAFC' }}>Upload Your Resume</h3>
                  <div className={isParsing ? "parsing-pulse" : ""} style={{ border: '2px dashed #334155', borderRadius: '8px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#0B1121', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}>
                    {isParsing ? (
                       <div><div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚙️</div><p style={{ color: '#38BDF8', margin: '0 0 5px 0', fontWeight: 'bold' }}>AI is Parsing...</p><p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: 0 }}>Generating Interview Blueprint</p></div>
                    ) : resumeFile ? (
                      <div><div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📄</div><p style={{ color: '#38BDF8', margin: '0 0 15px 0', fontWeight: '500', fontSize: '0.9rem' }}>{resumeFile}</p><p style={{ color: '#10B981', fontSize: '0.8rem', marginBottom: '15px' }}>✓ Blueprint generated</p><button className="btn-3d-dark" onClick={() => setResumeFile(null)} style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#EF4444' }}>Remove</button></div>
                    ) : (
                      <><div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📤</div><label className="btn-3d-blue" style={{ padding: '10px 20px', display: 'inline-block', fontSize: '0.95rem', fontWeight: '500' }}>Upload Resume<input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} /></label></>
                    )}
                  </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ color: '#F8FAFC', marginBottom: '25px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{isProfileIncomplete ? 'Complete Your Profile' : 'Edit Your Profile'}</h2>
            <form onSubmit={handleProfileUpdate} className="card-3d" style={{ backgroundColor: '#0F172A', padding: '30px', borderRadius: '16px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>Full Name</label><input type="text" className="input-3d" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} required /></div>
                <div><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>Email Address (Non-editable)</label><input type="email" className="input-3d input-disabled" value={currentUser.email} disabled /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>Phone Number</label><input type="tel" className="input-3d" placeholder="e.g. +91 9876543210" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} required /></div>
                <div><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>University / College</label><input type="text" className="input-3d" placeholder="e.g. SRM Delhi NCR Campus" value={profileForm.college} onChange={(e) => setProfileForm({...profileForm, college: e.target.value})} required /></div>
              </div>
              <div><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>Target Job Preference</label><input type="text" className="input-3d" placeholder="e.g. Cloud & Gen AI Engineer" value={profileForm.job_preference} onChange={(e) => setProfileForm({...profileForm, job_preference: e.target.value})} required /></div>
              <div style={{ borderTop: '1px solid #1E293B', paddingTop: '20px', marginTop: '10px' }}><label style={{ display: 'block', color: '#94A3B8', marginBottom: '8px', fontSize: '0.9rem' }}>Change Password (Optional)</label><input type="password" className="input-3d" placeholder="Leave blank to keep current password" value={profileForm.new_password} onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}><span style={{ color: profileUpdateMsg.includes('Error') ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{profileUpdateMsg}</span><button type="submit" className="btn-3d-blue" style={{ padding: '15px 30px', fontSize: '1.1rem', fontWeight: 'bold' }}>Save Profile</button></div>
            </form>
          </div>
        )}

        {/* INTERVIEW */}
        {activeTab === 'interview' && (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '300px', backgroundColor: '#111827', padding: '30px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 15px rgba(0,0,0,0.2)' }}>
              <h3 style={{ marginBottom: '20px', color: '#E2E8F0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Session Setup</h3>
              <div className="card-3d" style={{ backgroundColor: '#000', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', position: 'relative', border: '2px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {interviewActive ? <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /> : <span style={{ color: '#64748B' }}>Camera Off</span>}
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '12px' }}>
                   <div style={{ width: '8px', height: '8px', backgroundColor: interviewActive ? '#10B981' : '#EF4444', borderRadius: '50%', boxShadow: interviewActive ? '0 0 8px #10B981' : '0 0 8px #EF4444' }}></div><span style={{ fontSize: '0.7rem', color: '#FFF' }}>{interviewActive ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
              <button onClick={interviewActive ? handleEndInterview : () => setInterviewActive(true)} className={interviewActive ? "btn-3d-red" : "btn-3d-blue"} style={{ padding: '15px', fontWeight: 'bold', fontSize: '1rem', marginTop: 'auto' }}>
                {interviewActive ? 'End Interview' : 'Start Interview'}
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
              <h2 style={{ color: '#F8FAFC', margin: '0 0 20px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Live Mock Interview</h2>
              <div className="card-3d" style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: '12px', padding: '25px', overflowY: 'auto', border: '1px solid #1E293B', marginBottom: '20px', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.3)' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
                    <div style={{ maxWidth: '75%', padding: '16px', borderRadius: '16px', backgroundColor: msg.sender === 'user' ? '#0284C7' : '#1E293B', color: '#F8FAFC', borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px', lineHeight: '1.6', fontSize: '0.95rem', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: msg.sender === 'user' ? '#bae6fd' : '#94A3B8', textTransform: 'uppercase' }}>{msg.sender === 'user' ? currentUser.name.split(' ')[0] : 'AI Agent'}</strong>{msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && <div style={{ color: '#94A3B8' }}>Agent is typing...</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <input type="text" className="input-3d" style={{ marginBottom: 0 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder={interviewActive ? "Type your answer..." : "Click 'Start Interview'..."} disabled={!interviewActive} />
                <button onClick={sendMessage} disabled={isLoading || !interviewActive || !input.trim()} className="btn-3d-green" style={{ padding: '0 35px', fontSize: '1rem', fontWeight: 'bold', opacity: (!interviewActive || !input.trim()) ? 0.5 : 1 }}>Send</button>
              </div>
            </div>
          </div>
        )}
        
        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            
            {!selectedReport ? (
                <>
                    <h2 style={{ color: '#F8FAFC', marginBottom: '25px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Interview Analytics</h2>
                    {(!currentUser.reports || currentUser.reports.length === 0) ? (
                        <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '60px', borderRadius: '16px', border: '1px solid #1E293B', textAlign: 'center' }}>
                            <span style={{ fontSize: '4rem' }}>📈</span>
                            <h3 style={{ color: '#E2E8F0', marginTop: '20px' }}>No Data Available</h3>
                            <p style={{ color: '#94A3B8' }}>Complete a mock interview to generate your first performance report.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {currentUser.reports.map((report) => (
                                <div key={report.id} onClick={() => setSelectedReport(report)} className="card-3d" style={{ backgroundColor: '#0F172A', padding: '25px', borderRadius: '16px', border: '1px solid #1E293B', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📁</div>
                                    <h3 style={{ color: '#38BDF8', margin: '0 0 10px 0', fontSize: '1.4rem' }}>{report.title}</h3>
                                    <span style={{ backgroundColor: '#1E293B', color: '#10B981', padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>AI Graded</span>
                                    <button className="btn-3d-dark" style={{ marginTop: '20px', width: '100%', padding: '10px' }}>View Report</button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                       ← Back to Reports
                    </button>
                    
                    <div className="card-3d" style={{ backgroundColor: '#0F172A', padding: '40px', borderRadius: '16px', border: '1px solid #1E293B' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '20px', marginBottom: '30px' }}>
                            <h2 style={{ color: '#38BDF8', margin: 0, fontSize: '1.8rem' }}>{selectedReport.title}</h2>
                            <span style={{ backgroundColor: '#1E293B', color: '#10B981', padding: '8px 20px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>Verified</span>
                        </div>
                        
                        {typeof selectedReport.content === 'string' ? (
                             <div style={{ color: '#E2E8F0', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                                {selectedReport.content.replace(/\*\*/g, '')}
                             </div>
                        ) : (
                             <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1121', padding: '30px', borderRadius: '16px', border: '1px solid #1E293B' }}>
                                        <h3 style={{ color: '#94A3B8', margin: '0 0 20px 0', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Score</h3>
                                        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(#10B981 ${selectedReport.content?.overall_score || 0}%, #1E293B 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#0B1121', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F8FAFC' }}>{selectedReport.content?.overall_score || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#0B1121', padding: '30px', borderRadius: '16px', border: '1px solid #1E293B' }}>
                                        <SkillBar label="Communication Skills" score={selectedReport.content?.metrics?.communication} />
                                        <SkillBar label="Technical Depth" score={selectedReport.content?.metrics?.technical_depth} />
                                        <SkillBar label="Confidence Signals" score={selectedReport.content?.metrics?.confidence} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid #38BDF8' }}>
                                        <h3 style={{ color: '#38BDF8', margin: '0 0 10px 0', fontSize: '1.2rem' }}>Executive Summary</h3>
                                        <p style={{ color: '#E2E8F0', margin: 0, lineHeight: '1.6' }}>{selectedReport.content?.overall_impression}</p>
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#F8FAFC', margin: '0 0 15px 0', fontSize: '1.2rem', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>Detailed Analysis</h3>
                                        <p style={{ color: '#94A3B8', margin: 0, lineHeight: '1.8' }}>{selectedReport.content?.detailed_analysis}</p>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '25px', borderRadius: '12px', borderLeft: '4px solid #EF4444' }}>
                                        <h3 style={{ color: '#EF4444', margin: '0 0 15px 0', fontSize: '1.2rem' }}>Key Areas for Improvement</h3>
                                        <ul style={{ color: '#E2E8F0', margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                                            {selectedReport.content?.areas_for_improvement?.map((point, idx) => <li key={idx} style={{ marginBottom: '8px' }}>{point}</li>)}
                                        </ul>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;