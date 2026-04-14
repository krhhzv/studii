import React, { useState, useEffect, useRef } from 'https://esm.sh/react';
import ReactDOM from 'https://esm.sh/react-dom/client';

/* ================= UTILS ================= */

const cleanInput = (t) => t.replace(/[<>]/g, "");
const limitText = (t) => t.slice(0, 20);

const safeJSON = (k, f) => {
  try { return JSON.parse(localStorage.getItem(k)) || f; }
  catch { return f; }
};

const playSound = (id, volume = 0.3) => {
  const el = document.getElementById(id);
  if (el) {
    el.volume = volume;
    el.currentTime = 0;
    el.play().catch(()=>{});
  }
};

const vibrate = (pattern = [20]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

const formatTime = (t) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }
  return `${m}:${s.toString().padStart(2,"0")}`;
};

/* ================= SWIPE ================= */

const useSwipe = (onLeft, onRight) => {
  const startX = useRef(0);
  const endX = useRef(0);

  return {
    onTouchStart: (e) => startX.current = e.touches[0].clientX,
    onTouchMove: (e) => endX.current = e.touches[0].clientX,
    onTouchEnd: () => {
      const diff = startX.current - endX.current;
      if (diff > 60) onLeft();
      if (diff < -60) onRight();
    }
  };
};

/* ================= LONG PRESS ================= */

const useLongPress = (onLong, onClick, delay = 500) => {
  const timer = useRef();
  const isMoved = useRef(false);

  return {
    onTouchStart: () => {
      isMoved.current = false;
      timer.current = setTimeout(onLong, delay);
    },
    onTouchMove: () => {
      isMoved.current = true;
      clearTimeout(timer.current);
    },
    onTouchEnd: (e) => {
      clearTimeout(timer.current);
      if (!isMoved.current) onClick(e);
    },
    onMouseDown: () => timer.current = setTimeout(onLong, delay),
    onMouseUp: () => clearTimeout(timer.current),
    onClick: (e) => e.stopPropagation()
  };
};

/* ================= MODAL ================= */

const Modal = ({ isOpen, title, value, onChange, onConfirm, onCancel, confirmText, type = "input" }) => {
  if (!isOpen) return null;

  return React.createElement("div", { className: "modal-overlay", onClick: onCancel },
    React.createElement("div", { className: "modal", onClick: e => e.stopPropagation() },
      React.createElement("div", { className: "modal-title" }, title),
      type === "input" && React.createElement("input", {
        id: "modal-input-field",
        className: "modal-input",
        autoFocus: true,
        value: value,
        onChange: (e) => onChange(e.target.value),
        onKeyDown: (e) => { if (e.key === "Enter") onConfirm(); }
      }),
      React.createElement("div", { className: "modal-btns" },
        React.createElement("button", { id: "modal-cancel-btn", className: "btn", onClick: onCancel }, "cancel"),
        React.createElement("button", { id: "modal-confirm-btn", className: "btn btn-primary", onClick: onConfirm }, confirmText)
      )
    )
  );
};

/* ================= SUBJECT CHIP ================= */

const SubjectChip = ({ s, selected, setSelected, onRemoveRequest }) => {

  const longPress = useLongPress(
    () => {
      onRemoveRequest(s);
    },
    (e) => {
      e.stopPropagation();
      setSelected(s);
      playSound("clickSound");
      vibrate();
    }
  );

  return React.createElement(
    "div",
    {
      className: `sub ${selected?.id === s.id ? "active" : ""}`,
      ...longPress
    },
    s.name
  );
};

/* ================= STATS ================= */

const Stats = ({ setScreen, installPrompt, onInstall }) => {

  const weekly = safeJSON("weekly", {});
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const values = days.map(d => weekly[d] || 0);
  const max = Math.max(...values, 60);

  return React.createElement(
    "div",
    { className: "stats-screen screen" },

    React.createElement("div",{className:"topbar"},
      React.createElement("div",{className:"logo"},"stats"),
      React.createElement("div",{id:"stats-back-btn",className:"profile-btn",onClick:()=>setScreen("home")},"←")
    ),

    React.createElement("div",{className:"card"},
      React.createElement("div",{className:"card-title"},"weekly progress"),
      React.createElement("div",{className:"graph"},
        days.map((d,i)=>
          React.createElement("div",{key:d,className:"bar-wrap"},
            React.createElement("div",{className:"bar",style:{height:`${(values[i]/max)*100}%`}}),
            React.createElement("div",{className:"bar-label"},d)
          )
        )
      )
    ),

    installPrompt && React.createElement("div", { className: "install-card" },
      React.createElement("div", { className: "install-text" }, "get the app for the best experience!"),
      React.createElement("button", { id: "install-pwa-btn", className: "btn btn-primary", onClick: onInstall }, "install studii.")
    )
  );
};

/* ================= FOCUS ================= */

const Focus = ({ setScreen, time, setTime, running, setRunning }) => {

  const [editing, setEditing] = useState(false);
  const maxTime = 6 * 3600;

  return React.createElement(
    "div",
    { className: "focus-screen screen" },

    React.createElement("div",{className:"focus-header"},
      React.createElement("button",{id:"focus-back-btn",className:"btn",onClick:()=>setScreen("home")},"← back"),
      React.createElement("div",{className:"logo"},"focus.")
    ),

    React.createElement("div",{className:"focus-body"},

      React.createElement("div",{className:`focus-circle ${running?"running":""}`},

        editing
        ? React.createElement("input",{
            className:"timer-input",
            autoFocus: true,
            defaultValue:Math.floor(time/60),
            onBlur:(e)=>{
              let val = parseInt(e.target.value) || 25;
              setTime(Math.min(maxTime, Math.max(60, val * 60)));
              setEditing(false);
            },
            onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); }
          })
        : React.createElement("div",{
            className:"focus-time",
            onClick:()=>setEditing(true)
          },formatTime(time))
      ),

      React.createElement("div",{className:"pet"},"🐥"),

      React.createElement("div",{className:"controls"},
        React.createElement("button",{className:`btn ${running?"":"btn-primary"}`,onClick:()=>{
          setRunning(!running);
          playSound("clickSound");
        }},running?"⏸ pause":"▶ start"),

        React.createElement("button",{className:"btn",onClick:()=>{
          setRunning(false);
          setTime(1500);
        }},"↺ reset")
      )
    )
  );
};

/* ================= MAIN ================= */

const App = () => {

  const [screen,setScreen] = useState("home");

  const [subjects,setSubjects] = useState(safeJSON("subjects",[
    {id:"1",name:"science"},
    {id:"2",name:"math"}
  ]));

  const [selected,setSelected] = useState(subjects[0]);

  const [time,setTime] = useState(1500);
  const [running,setRunning] = useState(false);

  const [streak,setStreak] = useState(Number(localStorage.getItem("streak"))||0);
  const [lastStudy,setLastStudy] = useState(localStorage.getItem("lastStudy")||"");

  const [todayMinutes,setTodayMinutes] = useState(Number(localStorage.getItem("todayMinutes"))||0);
  const [dailyGoal,setDailyGoal] = useState(Number(localStorage.getItem("dailyGoal"))||60);

  const [editing,setEditing] = useState(false);
  const maxTime = 6 * 3600;

  /* MODALS */
  const [modalType, setModalType] = useState(null); // 'add' or 'delete'
  const [modalValue, setModalValue] = useState("");
  const [targetSub, setTargetSub] = useState(null);

  const addTitles = ["✏️ new subject?", "📚 what are we studying?", "🐣 add something new?", "🌱 start a new subject?"];
  const [addTitle] = useState(addTitles[Math.floor(Math.random() * addTitles.length)]);

  /* PWA INSTALL */
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const swipe = useSwipe(
    ()=>setScreen("stats"),
    ()=>setScreen("home")
  );

  /* SAVE */
  useEffect(()=>{
    localStorage.setItem("subjects",JSON.stringify(subjects));
    localStorage.setItem("streak",streak);
    localStorage.setItem("todayMinutes",todayMinutes);
    localStorage.setItem("dailyGoal",dailyGoal);
  },[subjects,streak,todayMinutes,dailyGoal]);

  /* TIMER */
  useEffect(()=>{
    let i;

    if(running && time>0){
      i=setInterval(()=>setTime(t=>t-1),1000);
    }

    if(time===0){
      setRunning(false);
      playSound("doneSound");
      vibrate([80,40,80]);

      const today=new Date().toDateString();

      if(lastStudy!==today){
        const y=new Date(); y.setDate(y.getDate()-1);

        if(lastStudy===y.toDateString()) setStreak(s=>s+1);
        else setStreak(1);

        setLastStudy(today);
        localStorage.setItem("lastStudy",today);
      }

      setTodayMinutes(m=>m+25);
      setTime(1500);
    }

    return ()=>clearInterval(i);
  },[running,time]);

  /* NAV */
  if(screen==="stats") return React.createElement(Stats,{setScreen, installPrompt: !!deferredPrompt, onInstall: handleInstall});
  if(screen==="focus") return React.createElement(Focus,{setScreen,time,setTime,running,setRunning});

  const getDeleteMsg = (name) => {
    const msgs = [`🥀 remove "${name}"?`, `🐣 let go of "${name}"?`, `✂️ delete "${name}"?`, `🌸 "${name}" will disappear…`];
    return msgs[Math.floor(Math.random() * msgs.length)];
  };

  /* HOME */
  return React.createElement(
    "div",
    { className:"app screen", ...swipe },

    React.createElement("div",{className:"topbar"},
      React.createElement("div",{className:"logo"},"studii."),
      React.createElement("div",{id:"nav-stats-btn",className:"profile-btn",onClick:()=>setScreen("stats")},"📊")
    ),

    React.createElement("div",{className:"content"},

      /* SUBJECTS */
      React.createElement("div",{className:"card"},
        React.createElement("div",{className:"card-title"},"subjects",
          React.createElement("div",{id:"add-subject-btn",className: "add-btn", onClick:(e)=>{
            e.stopPropagation();
            setModalType("add");
            setModalValue("");
          }},"+")
        ),
        React.createElement("div",{className:"subjects"},
          subjects.map(s=>React.createElement(SubjectChip,{
            key:s.id,s,selected,setSelected,
            onRemoveRequest:(sub)=>{
              setTargetSub(sub);
              setModalType("delete");
            }
          }))
        )
      ),

      /* TIMER */
      React.createElement("div",{id:"timer-card",className:"card text-center",onClick:(e)=>{
        if(e.target.classList.contains("timer-big")) {
          e.stopPropagation();
          setEditing(true);
        } else {
          setScreen("focus");
        }
      }},
        editing
        ? React.createElement("input",{
            className:"timer-input",
            autoFocus: true,
            defaultValue:Math.floor(time/60),
            onBlur:(e)=>{
              let val = parseInt(e.target.value) || 25;
              setTime(Math.min(maxTime, Math.max(60, val * 60)));
              setEditing(false);
            },
            onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); }
          })
        : React.createElement("div",{className:"timer-big"},formatTime(time)),

        React.createElement("div",{style:{opacity:0.5,fontSize:"14px"}},"tap to expand")
      ),

      /* PET */
      React.createElement("div",{className:"pet"},"🐥"),

      /* CONTROLS */
      React.createElement("div",{className:"controls"},
        React.createElement("button",{id:"start-btn",className:`btn ${running?"":"btn-primary"}`,onClick:()=>{
          setRunning(!running);
          playSound("clickSound");
          vibrate();
        }}, running ? "⏸ pause" : "▶ start"),
        React.createElement("button",{id:"reset-btn",className:"btn",onClick:()=>{
          setRunning(false);
          setTime(1500);
        }},"↺ reset")
      ),

      /* GOAL */
      React.createElement("div",{className:"card"},
        `daily goal ${todayMinutes}/${dailyGoal} min`
      ),

      /* STREAK */
      React.createElement("div",{className:"card text-center"},
        React.createElement("div",{style:{fontSize:"30px"}},"🔥"),
        `streak: ${streak} days`
      ),

      /* FOOTER */
      React.createElement("div",{className:"footer"},"made by a backbencher lol 😼")
    ),

    /* MODALS */
    React.createElement(Modal, {
      isOpen: modalType === "add",
      title: addTitle,
      value: modalValue,
      onChange: setModalValue,
      confirmText: "add",
      onCancel: () => setModalType(null),
      onConfirm: () => {
        if(modalValue.trim()){
          const newSub = {id:Date.now().toString(), name:limitText(cleanInput(modalValue))};
          setSubjects([...subjects, newSub]);
          if(subjects.length === 0) setSelected(newSub);
        }
        setModalType(null);
      }
    }),

    React.createElement(Modal, {
      isOpen: modalType === "delete",
      title: targetSub ? getDeleteMsg(targetSub.name) : "",
      confirmText: "bye",
      type: "confirm",
      onCancel: () => setModalType(null),
      onConfirm: () => {
        const newSubs = subjects.filter(x => x.id !== targetSub.id);
        setSubjects(newSubs);
        if(selected?.id === targetSub.id) setSelected(newSubs[0] || null);
        setModalType(null);
      }
    })
  );
};

/* RENDER */
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);