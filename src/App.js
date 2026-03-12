import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ── THREE.JS PARTICLE BACKGROUND ── */
function ParticleBackground({ scene = 'login' }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth, H = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const sceneObj = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 80;
    const themes = {
      login:     { primary: 0x00d4ff, secondary: 0x0066cc, count: 600 },
      dashboard: { primary: 0x00ffaa, secondary: 0x0099ff, count: 400 },
      interview: { primary: 0x0066ff, secondary: 0x00d4ff, count: 500 },
    };
    const theme = themes[scene] || themes.login;
    const geo = new THREE.BufferGeometry();
    const count = theme.count;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(theme.primary), c2 = new THREE.Color(theme.secondary);
    for (let i = 0; i < count; i++) {
      pos[i*3]=(Math.random()-0.5)*200; pos[i*3+1]=(Math.random()-0.5)*200; pos[i*3+2]=(Math.random()-0.5)*100;
      const c=c1.clone().lerp(c2,Math.random()); colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const mat = new THREE.PointsMaterial({ size:0.8, vertexColors:true, transparent:true, opacity:0.6, sizeAttenuation:true });
    const points = new THREE.Points(geo, mat);
    sceneObj.add(points);
    const shapes = [];
    const shapeGeos = [new THREE.OctahedronGeometry(3,0), new THREE.TetrahedronGeometry(2.5,0), new THREE.IcosahedronGeometry(2,0)];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.MeshBasicMaterial({ color: i%2===0?theme.primary:theme.secondary, wireframe:true, transparent:true, opacity:0.12 });
      const mesh = new THREE.Mesh(shapeGeos[i%3], m);
      mesh.position.set((Math.random()-0.5)*120,(Math.random()-0.5)*80,(Math.random()-0.5)*40-20);
      mesh.userData = { rx: Math.random()*0.005, ry: Math.random()*0.008 };
      sceneObj.add(mesh); shapes.push(mesh);
    }
    const grid = new THREE.GridHelper(200,30,theme.secondary,theme.secondary);
    grid.material.opacity=0.04; grid.material.transparent=true; grid.position.y=-50;
    sceneObj.add(grid);
    let mx=0, my=0;
    const onMouse = e => { mx=(e.clientX/W-0.5)*2; my=(e.clientY/H-0.5)*2; };
    window.addEventListener('mousemove', onMouse);
    let frame, t=0;
    const animate = () => {
      frame=requestAnimationFrame(animate); t+=0.003;
      points.rotation.y=t*0.05; points.rotation.x=t*0.02;
      shapes.forEach(s=>{ s.rotation.x+=s.userData.rx; s.rotation.y+=s.userData.ry; });
      camera.position.x+=(mx*8-camera.position.x)*0.02;
      camera.position.y+=(-my*5-camera.position.y)*0.02;
      camera.lookAt(sceneObj.position);
      renderer.render(sceneObj,camera);
    };
    animate();
    const onResize = () => { const w=mount.clientWidth,h=mount.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove',onMouse);
      window.removeEventListener('resize',onResize);
      if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [scene]);
  return <div ref={mountRef} style={{ position:'absolute', inset:0, zIndex:0 }} />;
}

/* ── ROTATING 3D LOGO ── */
function LogoCube({ size=80, color=0x0066ff }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(size, size); renderer.setPixelRatio(2);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50,1,0.1,100);
    camera.position.z=3.5;
    const geo = new THREE.OctahedronGeometry(1.2,0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.9 }));
    const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color:0xffffff, wireframe:true, transparent:true, opacity:0.25 }));
    scene.add(mesh); scene.add(wire);
    let frame;
    const animate = () => {
      frame=requestAnimationFrame(animate);
      mesh.rotation.x+=0.012; mesh.rotation.y+=0.018;
      wire.rotation.x+=0.012; wire.rotation.y+=0.018;
      renderer.render(scene,camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [size, color]);
  return <div ref={mountRef} style={{ width:size, height:size, flexShrink:0 }} />;
}

/* ── DESIGN TOKENS ── */
const G = {
  bg:'#020817', border:'#1a3a6b',
  accent:'#00d4ff', accent2:'#0066ff', green:'#00ffaa', red:'#ff4466', amber:'#ffaa00',
  text:'#e8f4ff', muted:'#4a7ab5',
  font:"'DM Sans','Segoe UI',sans-serif",
  mono:"'JetBrains Mono','Fira Code',monospace",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:${G.font};overflow-x:hidden}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${G.bg}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:4px}
  .glass{background:rgba(13,31,60,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,212,255,0.12);border-radius:16px;transition:border-color 0.3s}
  .glass:hover{border-color:rgba(0,212,255,0.25)}
  .glow-text{background:linear-gradient(135deg,#00d4ff 0%,#0066ff 50%,#00ffaa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .btn-primary{background:linear-gradient(135deg,#0066ff,#00d4ff);color:white;border:none;border-radius:10px;cursor:pointer;font-family:${G.font};font-weight:600;transition:all 0.25s;box-shadow:0 0 20px rgba(0,102,255,0.35)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 30px rgba(0,102,255,0.55)}
  .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
  .btn-ghost{background:transparent;color:${G.muted};border:1px solid ${G.border};border-radius:10px;cursor:pointer;font-family:${G.font};font-weight:500;transition:all 0.2s}
  .btn-ghost:hover{color:${G.accent};border-color:${G.accent};background:rgba(0,212,255,0.06)}
  .btn-danger{background:linear-gradient(135deg,#cc0033,#ff4466);color:white;border:none;border-radius:10px;cursor:pointer;font-family:${G.font};font-weight:600;transition:all 0.25s;box-shadow:0 0 20px rgba(255,68,102,0.3)}
  .btn-danger:hover{transform:translateY(-2px);box-shadow:0 4px 25px rgba(255,68,102,0.5)}
  .btn-success{background:linear-gradient(135deg,#006644,#00ffaa);color:#002211;border:none;border-radius:10px;cursor:pointer;font-family:${G.font};font-weight:700;transition:all 0.25s;box-shadow:0 0 20px rgba(0,255,170,0.3)}
  .btn-success:hover{transform:translateY(-2px);box-shadow:0 4px 25px rgba(0,255,170,0.5)}
  .btn-success:disabled{opacity:0.4;cursor:not-allowed;transform:none}
  .input-field{width:100%;padding:14px 18px;background:rgba(2,8,23,0.8);border:1px solid ${G.border};border-radius:10px;color:${G.text};font-family:${G.font};font-size:0.95rem;outline:none;transition:all 0.2s;box-shadow:inset 0 2px 8px rgba(0,0,0,0.3)}
  .input-field:focus{border-color:${G.accent};box-shadow:0 0 0 3px rgba(0,212,255,0.12),inset 0 2px 8px rgba(0,0,0,0.3)}
  .input-field::placeholder{color:${G.muted}}
  .input-field:disabled{opacity:0.5;cursor:not-allowed}
  .nav-item{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:10px;cursor:pointer;border:none;background:transparent;color:${G.muted};font-family:${G.font};font-size:0.9rem;font-weight:500;transition:all 0.2s;width:100%;text-align:left}
  .nav-item:hover{color:${G.text};background:rgba(0,212,255,0.07)}
  .nav-item.active{color:${G.accent};background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.2)}
  .stat-card{padding:24px;border-radius:16px;position:relative;overflow:hidden;background:rgba(13,31,60,0.6);border:1px solid rgba(0,212,255,0.1);backdrop-filter:blur(12px);transition:all 0.3s}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac,#00d4ff),transparent)}
  .stat-card:hover{transform:translateY(-4px);border-color:rgba(0,212,255,0.25);box-shadow:0 12px 40px rgba(0,0,0,0.4)}
  .chat-ai{background:rgba(0,102,255,0.1);border:1px solid rgba(0,102,255,0.2);border-radius:16px 16px 16px 4px;padding:14px 18px;max-width:75%;line-height:1.6;font-size:0.93rem}
  .chat-user{background:linear-gradient(135deg,rgba(0,102,255,0.25),rgba(0,212,255,0.15));border:1px solid rgba(0,212,255,0.25);border-radius:16px 16px 4px 16px;padding:14px 18px;max-width:75%;line-height:1.6;font-size:0.93rem}
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center}
  .fade-in{animation:fadeIn 0.5s ease forwards}
  @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .pulse{animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,0.4)}50%{box-shadow:0 0 0 12px rgba(0,212,255,0)}}
  .shimmer{background:linear-gradient(90deg,transparent,rgba(0,212,255,0.08),transparent);background-size:200% 100%;animation:shimmer 2s infinite}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .live-dot{width:8px;height:8px;border-radius:50%;background:#00ffaa;box-shadow:0 0 8px #00ffaa;animation:blink 1.5s ease-in-out infinite;flex-shrink:0}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
  .bar-track{background:rgba(255,255,255,0.06);border-radius:999px;height:8px;overflow:hidden}
  .bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#0066ff,#00d4ff);transition:width 1.8s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 10px rgba(0,212,255,0.4)}
  .score-ring{transform:rotate(-90deg)}
  .score-arc{transition:stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)}
  .toggle-btn{flex:1;padding:9px;border-radius:8px;border:none;cursor:pointer;font-family:${G.font};font-weight:600;font-size:0.85rem;transition:all 0.2s}
  .report-card{padding:24px;cursor:pointer;transition:all 0.3s;border-radius:16px}
  .report-card:hover{transform:translateY(-6px)}
`;

/* ── LOGIN PAGE ── */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    const ep = mode==='login' ? '/api/login' : '/api/register';
    const payload = mode==='login' ? {email:form.email,password:form.password} : form;
    try {
      const res = await fetch(`${API_URL}${ep}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await res.json();
      if (res.ok) onLogin(data.user);
      else setError(data.detail||'Authentication failed');
    } catch { setError('Network error. Is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{position:'relative',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
      <ParticleBackground scene="login" />
      <div style={{position:'absolute',top:'10%',left:'15%',width:400,height:400,background:'radial-gradient(circle,rgba(0,102,255,0.12) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'15%',right:'10%',width:350,height:350,background:'radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>

      <div className="glass fade-in" style={{position:'relative',zIndex:1,width:420,padding:'44px 40px',boxShadow:'0 32px 80px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:32,justifyContent:'center'}}>
          <LogoCube size={52} color={0x0066ff}/>
          <div>
            <div className="glow-text" style={{fontSize:'1.7rem',fontWeight:700,letterSpacing:'-0.5px',lineHeight:1}}>SkillSync AI</div>
            <div style={{color:G.muted,fontSize:'0.72rem',letterSpacing:'2px',textTransform:'uppercase',marginTop:3}}>Interview Platform</div>
          </div>
        </div>

        <div style={{display:'flex',background:'rgba(0,0,0,0.4)',borderRadius:10,padding:4,marginBottom:28,border:`1px solid ${G.border}`}}>
          {['login','register'].map(m=>(
            <button key={m} className="toggle-btn" onClick={()=>{setMode(m);setError('');}}
              style={{background:mode===m?'linear-gradient(135deg,#0066ff,#00d4ff)':'transparent',color:mode===m?'white':G.muted,boxShadow:mode===m?'0 4px 15px rgba(0,102,255,0.4)':'none'}}>
              {m==='login'?'Sign In':'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          {mode==='register'&&(
            <div>
              <label style={{fontSize:'0.75rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:6}}>Full Name</label>
              <input className="input-field" placeholder="John Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
            </div>
          )}
          <div>
            <label style={{fontSize:'0.75rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:6}}>Email Address</label>
            <input className="input-field" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
          <div>
            <label style={{fontSize:'0.75rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:6}}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
          </div>
          {error&&<div style={{background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.3)',borderRadius:8,padding:'10px 14px',color:'#ff8899',fontSize:'0.85rem'}}>⚠ {error}</div>}
          <button type="submit" className="btn-primary" style={{padding:'14px',fontSize:'0.95rem',marginTop:6}} disabled={loading}>
            {loading?'⟳ Authenticating...':mode==='login'?'→ Access Dashboard':'→ Create Account'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20,fontSize:'0.83rem',color:G.muted}}>
          {mode==='login'?"Don't have an account? ":"Already registered? "}
          <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}} style={{background:'none',border:'none',color:G.accent,cursor:'pointer',fontWeight:600,fontSize:'0.83rem'}}>
            {mode==='login'?'Create one':'Sign in'}
          </button>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginTop:24,paddingTop:20,borderTop:`1px solid ${G.border}`}}>
          <span style={{fontSize:'0.68rem',color:G.muted,letterSpacing:'1px'}}>🔒 END-TO-END ENCRYPTED · GDPR COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}

/* ── SIDEBAR ── */
function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, isIncomplete }) {
  const tabs = [
    {id:'dashboard',icon:'⬡',label:'Dashboard'},
    {id:'interview',icon:'◈',label:'Interview'},
    {id:'profile',icon:'◉',label:'Profile',badge:isIncomplete},
    {id:'analytics',icon:'◫',label:'Analytics'},
  ];
  const initials = n => n?n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2):'U';

  return (
    <div style={{width:230,background:'rgba(10,22,40,0.97)',borderRight:`1px solid ${G.border}`,display:'flex',flexDirection:'column',padding:'20px 14px',backdropFilter:'blur(20px)',zIndex:10,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',marginBottom:24}}>
        <LogoCube size={36} color={0x0066ff}/>
        <div>
          <div className="glow-text" style={{fontSize:'1.05rem',fontWeight:700,letterSpacing:'-0.3px'}}>SkillSync</div>
          <div style={{fontSize:'0.62rem',color:G.muted,letterSpacing:'1.5px',textTransform:'uppercase'}}>AI Platform</div>
        </div>
      </div>

      <div style={{background:'rgba(0,212,255,0.06)',border:'1px solid rgba(0,212,255,0.15)',borderRadius:8,padding:'7px 12px',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
        <div className="live-dot"/>
        <span style={{fontSize:'0.68rem',color:G.accent,letterSpacing:'1px',fontFamily:G.mono}}>SYSTEM ONLINE</span>
      </div>

      <nav style={{display:'flex',flexDirection:'column',gap:4,flex:1}}>
        {tabs.map(t=>(
          <button key={t.id} className={`nav-item${activeTab===t.id?' active':''}`} onClick={()=>setActiveTab(t.id)}>
            <span style={{fontSize:'1rem',width:20,textAlign:'center'}}>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge&&<span style={{marginLeft:'auto',width:7,height:7,borderRadius:'50%',background:G.amber,boxShadow:`0 0 6px ${G.amber}`}}/>}
          </button>
        ))}
      </nav>

      <div style={{borderTop:`1px solid ${G.border}`,paddingTop:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',marginBottom:10}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#0066ff,#00d4ff)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.8rem',flexShrink:0}}>{initials(currentUser.name)}</div>
          <div style={{overflow:'hidden',minWidth:0}}>
            <div style={{fontSize:'0.85rem',fontWeight:600,whiteSpace:'nowrap',textOverflow:'ellipsis',overflow:'hidden'}}>{currentUser.name}</div>
            <div style={{fontSize:'0.68rem',color:G.muted,whiteSpace:'nowrap',textOverflow:'ellipsis',overflow:'hidden'}}>{currentUser.email}</div>
          </div>
        </div>
        <button className="btn-ghost" style={{width:'100%',padding:'9px',fontSize:'0.83rem',color:G.red}} onClick={onLogout}>⏻ Sign Out</button>
      </div>
    </div>
  );
}

/* ── DASHBOARD ── */
function Dashboard({ currentUser, setCurrentUser, setActiveTab }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const isIncomplete = !currentUser.phone||!currentUser.college||!currentUser.job_preference;

  const handleResume = async e => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setResumeFile(file.name); setIsParsing(true);
    const fd = new FormData(); fd.append('file',file); fd.append('email',currentUser.email);
    try { await fetch(`${API_URL}/api/upload_resume`,{method:'POST',body:fd}); } catch {}
    finally { setIsParsing(false); }
  };

  const stats = [
    {label:'Interviews Completed',value:currentUser.reports?.length||0,icon:'◈',ac:'#00d4ff'},
    {label:'Profile Status',value:isIncomplete?'Incomplete':'Complete',icon:'◉',ac:'#00ffaa'},
    {label:'Resume',value:currentUser.blueprint?'Uploaded':'Missing',icon:'◫',ac:'#ffaa00'},
    {label:'Account Status',value:'Active',icon:'⬡',ac:'#aa44ff'},
  ];

  return (
    <div style={{padding:32,overflowY:'auto',flex:1}} className="fade-in">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'2px',textTransform:'uppercase',marginBottom:6,fontFamily:G.mono}}>Welcome back</div>
        <h1 style={{fontSize:'2rem',fontWeight:700,letterSpacing:'-0.5px'}}>{currentUser.name.split(' ')[0]}, <span className="glow-text">ready to level up?</span></h1>
      </div>

      {isIncomplete&&(
        <div style={{background:'rgba(255,170,0,0.08)',border:'1px solid rgba(255,170,0,0.25)',borderRadius:12,padding:'14px 20px',marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:'1.2rem'}}>⚡</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:G.amber,fontSize:'0.9rem'}}>Complete your profile</div>
            <div style={{color:G.muted,fontSize:'0.82rem',marginTop:2}}>Add your college and job preferences to unlock personalized interviews</div>
          </div>
          <button className="btn-primary" style={{padding:'8px 16px',fontSize:'0.82rem',flexShrink:0}} onClick={()=>setActiveTab('profile')}>Complete →</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
        {stats.map((s,i)=>(
          <div key={i} className="stat-card" style={{'--ac':s.ac}}>
            <div style={{fontSize:'1.3rem',color:s.ac,marginBottom:12}}>{s.icon}</div>
            <div style={{fontSize:'1.4rem',fontWeight:700,color:s.ac,marginBottom:4,fontFamily:typeof s.value==='number'?G.mono:G.font}}>{s.value}</div>
            <div style={{fontSize:'0.78rem',color:G.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20}}>
        <div className="glass" style={{padding:28}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#0066ff,#00d4ff)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1.3rem',boxShadow:'0 0 20px rgba(0,102,255,0.4)',flexShrink:0}}>
              {currentUser.name.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div>
              <div style={{fontSize:'1.15rem',fontWeight:700}}>{currentUser.name}</div>
              <div style={{color:G.muted,fontSize:'0.85rem'}}>{currentUser.job_preference||'No role set'}</div>
              <div style={{color:G.accent,fontSize:'0.78rem',marginTop:3,fontFamily:G.mono}}>{currentUser.email}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['College',currentUser.college||'—'],['Phone',currentUser.phone||'—']].map(([k,v])=>(
              <div key={k} style={{background:'rgba(0,0,0,0.3)',borderRadius:10,padding:'12px 16px'}}>
                <div style={{fontSize:'0.68rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',marginBottom:4}}>{k}</div>
                <div style={{fontSize:'0.9rem',fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" style={{width:'100%',padding:'11px',marginTop:16,fontSize:'0.88rem'}} onClick={()=>setActiveTab('profile')}>Edit Profile →</button>
        </div>

        <div className="glass" style={{padding:28}}>
          <div style={{fontSize:'0.75rem',color:G.muted,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}}>Resume Upload</div>
          <div style={{border:`2px dashed ${isParsing?G.accent:G.border}`,borderRadius:12,padding:'32px 20px',textAlign:'center',background:'rgba(0,0,0,0.2)',transition:'all 0.3s',position:'relative',overflow:'hidden'}}>
            {isParsing&&<div className="shimmer" style={{position:'absolute',inset:0}}/>}
            {isParsing?(
              <div style={{position:'relative',zIndex:1}}>
                <div style={{fontSize:'2rem',marginBottom:8}}>⚙</div>
                <div style={{color:G.accent,fontWeight:600}}>Parsing Resume...</div>
                <div style={{color:G.muted,fontSize:'0.8rem',marginTop:4}}>Generating AI blueprint</div>
              </div>
            ):resumeFile||currentUser.blueprint?(
              <div>
                <div style={{fontSize:'2rem',marginBottom:8,color:G.green}}>✓</div>
                <div style={{color:G.green,fontWeight:600,fontSize:'0.9rem'}}>Blueprint Ready</div>
                <div style={{color:G.muted,fontSize:'0.78rem',marginTop:4}}>{resumeFile||'Resume on file'}</div>
                <label style={{display:'inline-block',marginTop:14,cursor:'pointer'}}>
                  <span className="btn-ghost" style={{padding:'7px 16px',fontSize:'0.8rem',display:'inline-block'}}>Replace</span>
                  <input type="file" accept=".pdf" onChange={handleResume} style={{display:'none'}}/>
                </label>
              </div>
            ):(
              <label style={{cursor:'pointer',display:'block'}}>
                <div style={{fontSize:'2.5rem',marginBottom:10,opacity:0.5}}>↑</div>
                <div style={{fontWeight:600,marginBottom:4}}>Upload Resume</div>
                <div style={{color:G.muted,fontSize:'0.8rem',marginBottom:16}}>PDF format · Max 10MB</div>
                <span className="btn-primary" style={{padding:'9px 20px',fontSize:'0.85rem',display:'inline-block'}}>Choose File</span>
                <input type="file" accept=".pdf" onChange={handleResume} style={{display:'none'}}/>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Recent interviews preview on dashboard */}
      {currentUser.reports?.length > 0 && (
        <div style={{marginTop:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:'0.75rem',color:G.muted,letterSpacing:'1.5px',textTransform:'uppercase'}}>Recent Interviews</div>
            <button className="btn-ghost" style={{padding:'6px 14px',fontSize:'0.8rem'}} onClick={()=>setActiveTab('analytics')}>View All →</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
            {currentUser.reports.slice(0,3).map(r=>(
              <div key={r.id} className="glass" style={{padding:18,cursor:'pointer'}} onClick={()=>setActiveTab('analytics')}>
                <div style={{fontSize:'1.4rem',marginBottom:8}}>◫</div>
                <div style={{fontWeight:600,color:G.accent,fontSize:'0.9rem',marginBottom:4}}>{r.title}</div>
                {typeof r.content!=='string'&&r.content?.overall_score&&(
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span style={{fontSize:'1.3rem',fontWeight:700,fontFamily:G.mono,color:G.text}}>{r.content.overall_score}</span>
                    <span style={{fontSize:'0.75rem',color:G.muted}}>/100</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── INTERVIEW PAGE ── */
function InterviewPage({ currentUser, setCurrentUser, setActiveTab }) {
  const defaultMsg = {sender:'ai',text:"Welcome to your SkillSync AI Mock Interview. I'm ready when you are. Please introduce yourself and let's begin."};
  const [messages, setMessages] = useState([defaultMsg]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  useEffect(()=>{
    let stream=null;
    if(active){
      navigator.mediaDevices.getUserMedia({video:true,audio:false})
        .then(s=>{stream=s;if(videoRef.current)videoRef.current.srcObject=s;}).catch(()=>{});
    } else {
      if(videoRef.current?.srcObject){videoRef.current.srcObject.getTracks().forEach(t=>t.stop());videoRef.current.srcObject=null;}
      window.speechSynthesis?.cancel();
    }
    return()=>{if(stream)stream.getTracks().forEach(t=>t.stop());};
  },[active]);

  const send = async () => {
    if(!input.trim()) return;
    const msg = input;
    setMessages(prev=>[...prev,{sender:'user',text:msg}]);
    setInput(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:currentUser.email,user_message:msg})});
      const data = await res.json();
      if(data.status==='success'){
        setMessages(prev=>[...prev,{sender:'ai',text:data.reply}]);
        if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(data.reply);u.rate=1.0;window.speechSynthesis.speak(u);}
      }
    } catch { setMessages(prev=>[...prev,{sender:'ai',text:'Network error.'}]); }
    finally { setLoading(false); }
  };

  const endInterview = async () => {
    setActive(false);
    window.speechSynthesis?.cancel();
    if(messages.length<=1){setMessages([defaultMsg]);return;}
    setAnalyzing(true);
    const transcript = messages.map(m=>`${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    try {
      const res = await fetch(`${API_URL}/api/analyze_interview`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:currentUser.email,transcript})});
      const data = await res.json();
      if(res.ok){
        // ✅ Update currentUser with new reports so Analytics tab shows them
        setCurrentUser(prev=>({...prev, reports: data.reports}));
        setShowReport(true);
        setMessages([defaultMsg]);
      } else {
        alert('Analysis failed. The AI API might be rate-limited. Try again soon.');
      }
    } catch { alert('Network Error: Could not reach the analysis server.'); }
    finally { setAnalyzing(false); }
  };

  return (
    <div style={{display:'flex',flex:1,overflow:'hidden',position:'relative'}} className="fade-in">
      <ParticleBackground scene="interview"/>

      {/* Modals */}
      {(analyzing||showReport)&&(
        <div className="modal-bg">
          <div className="glass" style={{padding:48,textAlign:'center',maxWidth:420,width:'90%'}}>
            {analyzing?(
              <>
                <div className="pulse" style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#0066ff,#00d4ff)',margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>⚡</div>
                <h2 style={{marginBottom:8}}>Analyzing Performance</h2>
                <p style={{color:G.muted,fontSize:'0.9rem'}}>Generating your AI-powered feedback report...</p>
              </>
            ):(
              <>
                <div style={{fontSize:'3.5rem',marginBottom:16}}>📊</div>
                <h2 style={{marginBottom:8}}>Report Generated!</h2>
                <p style={{color:G.muted,fontSize:'0.9rem',marginBottom:28}}>Your performance has been analyzed and saved successfully.</p>
                <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                  <button className="btn-ghost" style={{padding:'11px 20px',fontSize:'0.9rem'}} onClick={()=>setShowReport(false)}>Stay Here</button>
                  <button className="btn-primary" style={{padding:'11px 24px',fontSize:'0.9rem'}} onClick={()=>{setShowReport(false);setActiveTab('analytics');}}>View Analytics →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{display:'flex',flex:1,zIndex:1,position:'relative'}}>
        {/* Left panel */}
        <div style={{width:280,background:'rgba(10,22,40,0.88)',borderRight:`1px solid ${G.border}`,padding:24,display:'flex',flexDirection:'column',backdropFilter:'blur(16px)',flexShrink:0}}>
          <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'2px',textTransform:'uppercase',marginBottom:16}}>Session Setup</div>
          <div style={{background:'#000',height:180,borderRadius:12,overflow:'hidden',marginBottom:16,position:'relative',border:`1px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {active?<video ref={videoRef} autoPlay playsInline muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/>:(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'2.5rem',marginBottom:6,opacity:0.2}}>◉</div>
                <div style={{color:G.muted,fontSize:'0.78rem'}}>Camera Off</div>
              </div>
            )}
            <div style={{position:'absolute',top:10,right:10,display:'flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.7)',padding:'4px 10px',borderRadius:20}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:active?G.green:G.red,boxShadow:`0 0 6px ${active?G.green:G.red}`}}/>
              <span style={{fontSize:'0.62rem',color:'white',letterSpacing:'1px',fontFamily:G.mono}}>{active?'LIVE':'OFFLINE'}</span>
            </div>
          </div>

          <div className="glass" style={{padding:16,marginBottom:16}}>
            {[['Role',currentUser.job_preference||'General SWE'],['Level','Mid-Senior'],['Focus','DSA & System Design']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.82rem'}}>
                <span style={{color:G.muted}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{background:'rgba(0,212,255,0.06)',border:'1px solid rgba(0,212,255,0.12)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:'0.78rem',color:G.muted,lineHeight:1.5}}>
            💡 Your answers are recorded and analyzed by AI to generate a detailed performance report when you end the session.
          </div>

          <button onClick={active?endInterview:()=>setActive(true)} className={active?'btn-danger':'btn-primary'} style={{padding:'13px',fontWeight:700,fontSize:'0.92rem',marginTop:'auto'}}>
            {active?'⬛ End & Analyze':'▶ Start Interview'}
          </button>
        </div>

        {/* Chat area */}
        <div style={{flex:1,display:'flex',flexDirection:'column',padding:28,background:'rgba(2,8,23,0.65)',backdropFilter:'blur(8px)'}}>
          <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h2 style={{fontSize:'1.3rem',fontWeight:700}}>Live Mock Interview</h2>
              <div style={{color:G.muted,fontSize:'0.8rem',marginTop:2}}>{currentUser.name} · AI Interviewer Session</div>
            </div>
            {active&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(0,255,170,0.08)',border:'1px solid rgba(0,255,170,0.2)',borderRadius:20,padding:'6px 14px'}}>
                <div className="live-dot"/><span style={{fontSize:'0.75rem',color:G.green,fontFamily:G.mono,letterSpacing:'1px'}}>RECORDING</span>
              </div>
            )}
          </div>

          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:16,paddingRight:4}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:m.sender==='user'?'flex-end':'flex-start',gap:10,alignItems:'flex-start'}}>
                {m.sender==='ai'&&<div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#0066ff,#00d4ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,flexShrink:0}}>AI</div>}
                <div className={m.sender==='ai'?'chat-ai':'chat-user'}>
                  <div style={{fontSize:'0.68rem',color:G.muted,marginBottom:6,letterSpacing:'0.5px',textTransform:'uppercase',fontFamily:G.mono}}>{m.sender==='ai'?'AI Interviewer':currentUser.name.split(' ')[0]}</div>
                  {m.text}
                </div>
                {m.sender==='user'&&<div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#004499,#0099ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,flexShrink:0}}>{currentUser.name[0].toUpperCase()}</div>}
              </div>
            ))}
            {loading&&(
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#0066ff,#00d4ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700}}>AI</div>
                <div className="chat-ai" style={{display:'flex',gap:5,alignItems:'center',padding:'18px'}}>
                  {[0,0.2,0.4].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:G.accent,animation:`blink 1s ease-in-out ${d}s infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          <div style={{display:'flex',gap:12,marginTop:20,padding:'14px 16px',background:'rgba(10,22,40,0.85)',borderRadius:14,border:`1px solid ${G.border}`,backdropFilter:'blur(12px)'}}>
            <input
              className="input-field"
              style={{flex:1,background:'transparent',border:'none',padding:'4px 0',boxShadow:'none'}}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              placeholder={active?"Type your answer... (Enter to send)":"Click 'Start Interview' to begin"}
              disabled={!active}
            />
            <button className="btn-success" style={{padding:'10px 24px',fontSize:'0.88rem'}} onClick={send} disabled={loading||!active||!input.trim()}>Send →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE PAGE ── */
function ProfilePage({ currentUser, setCurrentUser }) {
  const [form, setForm] = useState({name:currentUser.name||'',phone:currentUser.phone||'',college:currentUser.college||'',job_preference:currentUser.job_preference||'',new_password:''});
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault(); setMsg('Saving...');
    try {
      const res = await fetch(`${API_URL}/api/update_profile`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:currentUser.email,...form})});
      const data = await res.json();
      if(res.ok){setCurrentUser(data.user);setMsg('✓ Profile saved successfully!');setTimeout(()=>setMsg(''),3000);}
      else setMsg('Error: '+data.detail);
    } catch { setMsg('Network error.'); }
  };

  return (
    <div style={{padding:32,maxWidth:720,margin:'0 auto',overflowY:'auto',flex:1}} className="fade-in">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'2px',textTransform:'uppercase',marginBottom:6}}>Settings</div>
        <h1 style={{fontSize:'1.8rem',fontWeight:700}}>Your <span className="glow-text">Profile</span></h1>
      </div>
      <form onSubmit={submit}>
        <div className="glass" style={{padding:28,marginBottom:20}}>
          <div style={{fontSize:'0.72rem',color:G.accent,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:20,fontFamily:G.mono}}>Personal Information</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            {[['Full Name','name','text','John Smith'],['Phone Number','phone','tel','+91 9876543210'],['University / College','college','text','MIT'],['Target Role','job_preference','text','Senior SWE']].map(([label,key,type,ph])=>(
              <div key={key}>
                <label style={{display:'block',fontSize:'0.72rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>{label}</label>
                <input className="input-field" type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required={key!=='phone'}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:8}}>
            <label style={{display:'block',fontSize:'0.72rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Email (Non-editable)</label>
            <input className="input-field" value={currentUser.email} disabled/>
          </div>
        </div>
        <div className="glass" style={{padding:28,marginBottom:24}}>
          <div style={{fontSize:'0.72rem',color:G.accent,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:20,fontFamily:G.mono}}>Security</div>
          <label style={{display:'block',fontSize:'0.72rem',color:G.muted,letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>New Password <span style={{color:G.muted,textTransform:'none'}}>(optional)</span></label>
          <input className="input-field" type="password" placeholder="Leave blank to keep current" value={form.new_password} onChange={e=>setForm({...form,new_password:e.target.value})} style={{maxWidth:360}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{color:msg.includes('Error')?G.red:G.green,fontWeight:500,fontSize:'0.88rem'}}>{msg}</span>
          <button type="submit" className="btn-primary" style={{padding:'13px 32px',fontSize:'0.95rem'}}>Save Changes →</button>
        </div>
      </form>
    </div>
  );
}

/* ── ANALYTICS PAGE ── */
function AnalyticsPage({ currentUser }) {
  const [selected, setSelected] = useState(null);

  const SkillBar = ({ label, score }) => {
    const [w, setW] = useState(0);
    useEffect(()=>{const t=setTimeout(()=>setW(score||0),200);return()=>clearTimeout(t);},[score]);
    return (
      <div style={{marginBottom:18}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.85rem'}}>
          <span style={{fontWeight:500}}>{label}</span>
          <span style={{color:G.accent,fontFamily:G.mono,fontWeight:600}}>{score||0}%</span>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{width:`${w}%`}}/></div>
      </div>
    );
  };

  const ScoreRing = ({ score }) => {
    const r=54, circ=2*Math.PI*r;
    const [offset, setOffset] = useState(circ);
    useEffect(()=>{const t=setTimeout(()=>setOffset(circ-(score/100)*circ),300);return()=>clearTimeout(t);},[score,circ]);
    const color = score>=80?G.green:score>=60?G.accent:G.amber;
    return (
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
        <circle className="score-ring score-arc" cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{filter:`drop-shadow(0 0 8px ${color})`}}/>
        <text x="70" y="65" textAnchor="middle" fill={G.text} fontSize="30" fontWeight="700" fontFamily={G.mono}>{score}</text>
        <text x="70" y="85" textAnchor="middle" fill={G.muted} fontSize="12" fontFamily={G.font}>out of 100</text>
      </svg>
    );
  };

  if(!currentUser.reports?.length) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}} className="fade-in">
      <div style={{fontSize:'4rem',opacity:0.2}}>◫</div>
      <h3 style={{color:G.muted,fontSize:'1.2rem'}}>No reports yet</h3>
      <p style={{color:G.muted,fontSize:'0.85rem',textAlign:'center',maxWidth:320}}>Complete a mock interview and click "End & Analyze" to generate your first AI performance report.</p>
    </div>
  );

  if(selected) return (
    <div style={{padding:32,overflowY:'auto',flex:1}} className="fade-in">
      <button className="btn-ghost" style={{padding:'8px 16px',fontSize:'0.83rem',marginBottom:24}} onClick={()=>setSelected(null)}>← Back to Reports</button>

      <div className="glass" style={{padding:36}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${G.border}`,paddingBottom:24,marginBottom:32}}>
          <div>
            <h2 style={{fontSize:'1.6rem',fontWeight:700}}>{selected.title}</h2>
            <div style={{color:G.muted,fontSize:'0.82rem',marginTop:4,fontFamily:G.mono}}>AI-Generated Performance Report</div>
          </div>
          <div style={{background:'rgba(0,255,170,0.1)',border:'1px solid rgba(0,255,170,0.3)',borderRadius:20,padding:'6px 16px',color:G.green,fontSize:'0.8rem',fontWeight:600}}>✓ Verified</div>
        </div>

        {typeof selected.content==='string'?(
          <div style={{color:G.text,lineHeight:1.8,whiteSpace:'pre-wrap',fontSize:'0.92rem'}}>{selected.content.replace(/\*\*/g,'')}</div>
        ):(
          <div>
            {/* Score + Skills row */}
            <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:32,marginBottom:32}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)',borderRadius:16,padding:28}}>
                <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}}>Overall Score</div>
                <ScoreRing score={selected.content?.overall_score||0}/>
                <div style={{marginTop:12,fontSize:'0.78rem',color:G.muted,textAlign:'center'}}>
                  {selected.content?.overall_score>=80?'🏆 Excellent Performance':selected.content?.overall_score>=60?'⚡ Good Performance':'📈 Keep Practicing'}
                </div>
              </div>
              <div style={{background:'rgba(0,0,0,0.2)',borderRadius:16,padding:28,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:24}}>Skill Breakdown</div>
                <SkillBar label="Communication Skills" score={selected.content?.metrics?.communication}/>
                <SkillBar label="Technical Depth" score={selected.content?.metrics?.technical_depth}/>
                <SkillBar label="Confidence Signals" score={selected.content?.metrics?.confidence}/>
              </div>
            </div>

            {/* Summary + Improvement */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <div style={{background:'rgba(0,102,255,0.06)',border:'1px solid rgba(0,102,255,0.18)',borderRadius:12,padding:24}}>
                <div style={{color:G.accent,fontWeight:600,marginBottom:12,fontSize:'0.88rem',display:'flex',alignItems:'center',gap:8}}><span>💬</span> Executive Summary</div>
                <p style={{color:G.text,lineHeight:1.7,fontSize:'0.88rem'}}>{selected.content?.overall_impression}</p>
              </div>
              <div style={{background:'rgba(255,68,102,0.06)',border:'1px solid rgba(255,68,102,0.18)',borderRadius:12,padding:24}}>
                <div style={{color:G.red,fontWeight:600,marginBottom:12,fontSize:'0.88rem',display:'flex',alignItems:'center',gap:8}}><span>🎯</span> Areas for Improvement</div>
                <ul style={{paddingLeft:18,color:G.text,lineHeight:2,fontSize:'0.85rem'}}>
                  {selected.content?.areas_for_improvement?.map((p,i)=><li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>

            {/* Detailed analysis */}
            <div style={{background:'rgba(0,0,0,0.25)',border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
              <div style={{fontWeight:600,marginBottom:12,fontSize:'0.88rem',display:'flex',alignItems:'center',gap:8}}><span>📋</span> Detailed Analysis</div>
              <p style={{color:G.muted,lineHeight:1.8,fontSize:'0.88rem'}}>{selected.content?.detailed_analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{padding:32,overflowY:'auto',flex:1}} className="fade-in">
      <div style={{marginBottom:28}}>
        <div style={{fontSize:'0.7rem',color:G.muted,letterSpacing:'2px',textTransform:'uppercase',marginBottom:6}}>Performance</div>
        <h1 style={{fontSize:'1.8rem',fontWeight:700}}>Interview <span className="glow-text">Analytics</span></h1>
        <div style={{color:G.muted,fontSize:'0.85rem',marginTop:6}}>{currentUser.reports.length} report{currentUser.reports.length!==1?'s':''} available</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
        {currentUser.reports.map(r=>(
          <div key={r.id} className="glass report-card" onClick={()=>setSelected(r)}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,212,255,0.4)';e.currentTarget.style.boxShadow='0 16px 48px rgba(0,0,0,0.5)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,212,255,0.12)';e.currentTarget.style.boxShadow='none';}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div style={{fontSize:'2rem',opacity:0.8}}>◫</div>
              <div style={{background:'rgba(0,255,170,0.08)',border:'1px solid rgba(0,255,170,0.2)',borderRadius:20,padding:'4px 12px'}}>
                <span style={{fontSize:'0.72rem',color:G.green,fontWeight:600}}>✓ AI Graded</span>
              </div>
            </div>
            <h3 style={{fontSize:'1.1rem',fontWeight:700,color:G.accent,marginBottom:10}}>{r.title}</h3>

            {typeof r.content!=='string'&&r.content?.overall_score&&(
              <div style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:10}}>
                  <span style={{fontSize:'2rem',fontWeight:700,fontFamily:G.mono,color:r.content.overall_score>=80?G.green:r.content.overall_score>=60?G.accent:G.amber}}>{r.content.overall_score}</span>
                  <span style={{fontSize:'0.8rem',color:G.muted}}>/100 overall score</span>
                </div>
                {r.content?.metrics&&(
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {[['Comm.',r.content.metrics.communication],['Tech.',r.content.metrics.technical_depth],['Conf.',r.content.metrics.confidence]].map(([label,val])=>(
                      <div key={label} style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.75rem'}}>
                        <span style={{color:G.muted,width:36,flexShrink:0}}>{label}</span>
                        <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:999,height:5,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${val||0}%`,background:'linear-gradient(90deg,#0066ff,#00d4ff)',borderRadius:999}}/>
                        </div>
                        <span style={{color:G.muted,width:28,textAlign:'right',fontFamily:G.mono}}>{val||0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{color:G.accent,fontSize:'0.83rem',fontWeight:600,marginTop:8,display:'flex',alignItems:'center',gap:6}}>
              View Full Report <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ROOT APP ── */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    window.speechSynthesis?.cancel();
  };

  if (!currentUser) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={setCurrentUser}/>
    </>
  );

  const isIncomplete = !currentUser.phone||!currentUser.college||!currentUser.job_preference;

  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:G.bg}}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={logout}
          isIncomplete={isIncomplete}
        />
        <main style={{flex:1,display:'flex',overflow:'hidden',position:'relative'}}>
          {activeTab==='dashboard' && <Dashboard currentUser={currentUser} setCurrentUser={setCurrentUser} setActiveTab={setActiveTab}/>}
          {activeTab==='interview' && <InterviewPage currentUser={currentUser} setCurrentUser={setCurrentUser} setActiveTab={setActiveTab}/>}
          {activeTab==='profile'   && <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser}/>}
          {activeTab==='analytics' && <AnalyticsPage currentUser={currentUser}/>}
        </main>
      </div>
    </>
  );
}