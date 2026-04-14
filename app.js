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

  return {
    onTouchStart: () => timer.current = setTimeout(onLong, delay),
    onTouchEnd: () => clearTimeout(timer.current),
    onMouseDown: () => timer.current = setTimeout(onLong, delay),
    onMouseUp: () => clearTimeout(timer.current),
    onClick
  };
};

/* ================= SUBJECT CHIP ================= */

const SubjectChip = ({ s, selected, setSelected, onRemove }) => {

  const longPress = useLongPress(
    () => {
      if (confirm(`remove "${s.name}"?`)) {
        onRemove(s);
      }
    },
    () => {
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

const Stats = ({ setScreen }) => {

  const weekly = safeJSON("weekly", {});
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const values = days.map(d => weekly[d] || 0);
  const max = Math.max(...values, 60);

  return React.createElement(
    "div",
    { className: "content screen" },

    React.createElement("div",{className:"topbar"},
      React.createElement("div",{className:"logo"},"stats"),
      React.createElement("div",{className:"profile-btn",onClick:()=>setScreen("home")},"←")
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
    )
  );
};

/* ================= FOCUS ================= */

const Focus = ({ setScreen, time, setTime, running, setRunning }) => {

  const [editing, setEditing] = useState(false);

  return React.createElement(
    "div",
    { className: "focus-screen screen" },

    React.createElement("div",{className:"focus-header"},
      React.createElement("button",{className:"btn",onClick:()=>setScreen("home")},"← back"),
      React.createElement("div",{className:"logo"},"focus.")
    ),

    React.createElement("div",{className:"focus-body"},

      React.createElement("div",{className:`focus-circle ${running?"running":""}`},

        editing
        ? React.createElement("input",{
            className:"timer-input",
            defaultValue:Math.floor(time/60),
            onBlur:(e)=>{
              setTime(Math.max(60,e.target.value*60));
              setEditing(false);
            }
          })
        : React.createElement("div",{
            className:"focus-time",
            onClick:()=>setEditing(true)
          },formatTime(time))
      ),

      React.createElement("div",{className:"focus-pet"},"🐥"),

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
  if(screen==="stats") return React.createElement(Stats,{setScreen});
  if(screen==="focus") return React.createElement(Focus,{setScreen,time,setTime,running,setRunning});

  /* HOME */
  return React.createElement(
    "div",
    { className:"app screen", ...swipe },

    React.createElement("div",{className:"topbar"},
      React.createElement("div",{className:"logo"},"studii."),
      React.createElement("div",{className:"profile-btn",onClick:()=>setScreen("stats")},"📊")
    ),

    React.createElement("div",{className:"content"},

      /* SUBJECTS */
      React.createElement("div",{className:"card"},
        React.createElement("div",{className:"card-title"},"subjects",
          React.createElement("span",{onClick:()=>{
            const s=prompt("new subject?");
            if(s){
              setSubjects([...subjects,{id:Date.now().toString(),name:limitText(cleanInput(s))}]);
            }
          }},"+")
        ),
        React.createElement("div",{className:"subjects"},
          subjects.map(s=>React.createElement(SubjectChip,{
            key:s.id,s,selected,setSelected,
            onRemove:(sub)=>setSubjects(subjects.filter(x=>x.id!==sub.id))
          }))
        )
      ),

      /* TIMER */
      React.createElement("div",{className:"card text-center",onClick:(e)=>{
        if(e.target.classList.contains("timer-big")) setEditing(true);
        else setScreen("focus");
      }},
        editing
        ? React.createElement("input",{className:"timer-input",defaultValue:Math.floor(time/60),
            onBlur:(e)=>{setTime(Math.max(60,e.target.value*60));setEditing(false);}
          })
        : React.createElement("div",{className:"timer-big"},formatTime(time)),

        React.createElement("div",{style:{opacity:0.5,fontSize:"14px"}},"tap to expand")
      ),

      /* PET */
      React.createElement("div",{className:"pet"},"🐥"),

      /* CONTROLS */
      React.createElement("div",{className:"controls"},
        React.createElement("button",{className:`btn ${running?"":"btn-primary"}`,onClick:()=>{
          setRunning(!running);
          playSound("clickSound");
          vibrate();
        }},"▶ start"),
        React.createElement("button",{className:"btn",onClick:()=>{
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
    )
  );
};

/* RENDER */
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
