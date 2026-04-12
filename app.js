import React, { useState, useEffect, useRef } from 'https://esm.sh/react';
import ReactDOM from 'https://esm.sh/react-dom/client';

// --- UTILS ---
const cleanInput = (text) => text.replace(/[<>]/g, "");
const limitText = (text) => text.slice(0, 20);
const safeJSON = (key, fallback) => {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data || fallback;
    } catch {
        return fallback;
    }
};

const playSound = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
    }
};

const useLongPress = (onLongPress, onClick, { delay = 500 } = {}) => {
    const [startLongPress, setStartLongPress] = useState(false);
    const timerRef = useRef();

    useEffect(() => {
        if (startLongPress) {
            timerRef.current = setTimeout(onLongPress, delay);
        } else {
            clearTimeout(timerRef.current);
        }
        return () => clearTimeout(timerRef.current);
    }, [startLongPress, onLongPress, delay]);

    return {
        onMouseDown: () => setStartLongPress(true),
        onMouseUp: () => setStartLongPress(false),
        onMouseLeave: () => setStartLongPress(false),
        onTouchStart: () => setStartLongPress(true),
        onTouchEnd: () => setStartLongPress(false),
        onClick: onClick
    };
};

const copyOptions = [
    { text: (name) => `remove "${name}"? 🥺`, yes: "yes", no: "nooo" },
    { text: (name) => `let go of "${name}"? ✿`, yes: "remove", no: "keep it" },
    { text: (name) => `"${name}" will disappear 🐣\nare you sure?`, yes: "bye", no: "nope" },
    { text: (name) => `remove "${name}"...? 🥀`, yes: "let go", no: "stay" }
];

// --- COMPONENTS ---

// Stats Screen
const Stats = ({ setScreen }) => {
    const [weekly, setWeekly] = useState({});
    useEffect(() => {
        setWeekly(safeJSON("weekly", {}));
    }, []);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const values = Object.values(weekly);
    const max = Math.max(...(values.length ? values : [0]), 60);

    return React.createElement('div', { className: 'content' },
        React.createElement('div', { className: 'topbar' },
            React.createElement('div', { className: 'logo' }, 'stats'),
            React.createElement('div', { className: 'profile-btn', onClick: () => setScreen('home') }, '←')
        ),
        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-title' }, 'weekly progress'),
            React.createElement('div', { className: 'graph' },
                days.map(d => {
                    const val = weekly[d] || 0;
                    return React.createElement('div', { key: d, className: 'bar-wrap' },
                        React.createElement('div', {
                            className: 'bar',
                            style: { height: `${(val / max) * 100}%` }
                        }),
                        React.createElement('div', { className: 'bar-label' }, d)
                    );
                })
            )
        )
    );
};

// Focus Screen (Full screen timer)
const Focus = ({ setScreen, time, running, setRunning, setTime, formatTime }) => {
    return React.createElement('div', { className: 'focus-screen' },
        React.createElement('div', { className: 'focus-header' },
            React.createElement('button', { className: 'btn', onClick: () => setScreen('home') }, '← back'),
            React.createElement('div', { className: 'logo' }, 'focus.')
        ),
        React.createElement('div', { className: 'focus-body' },
            React.createElement('div', { className: `focus-circle ${running ? 'running' : ''}` },
                React.createElement('div', { className: 'focus-time' }, formatTime(time))
            ),
            React.createElement('div', { className: 'focus-pet' }, time > 600 ? "🐣" : "🐥"),
            React.createElement('div', { className: 'controls' },
                React.createElement('button', { className: `btn ${running ? '' : 'btn-primary'}`, onClick: () => setRunning(!running) }, 
                    running ? '⏸ pause' : '▶ start'
                ),
                React.createElement('button', { className: 'btn', onClick: () => { setRunning(false); setTime(1500); } }, '↺ reset')
            )
        )
    );
};

// Home Screen
const Home = ({ setScreen, time, running, setRunning, setTime, formatTime, subjects, setSubjects, selected, setSelected, streak, dailyGoal, setDailyGoal, todayMinutes, onRemove }) => {
    
    const addSubject = () => {
        const s = prompt("new subject?");
        if (s) setSubjects([...subjects, limitText(cleanInput(s))]);
    };

    const renameSubject = (sub) => {
        const n = prompt("rename", sub);
        if (n) setSubjects(subjects.map(s => s === sub ? limitText(cleanInput(n)) : s));
    };

    return React.createElement('div', { className: 'content' },
        React.createElement('div', { className: 'topbar' },
            React.createElement('div', { className: 'logo' }, 'studii.'),
            React.createElement('div', { className: 'profile-btn', onClick: () => setScreen('stats') }, '📊')
        ),

        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-title' }, 'subjects', React.createElement('span', { onClick: addSubject, style: {cursor:'pointer'} }, '+')),
            React.createElement('div', { className: 'subjects' },
                subjects.length > 0 ? subjects.map((s, i) => React.createElement(SubjectChip, {
                    key: i,
                    s: s,
                    selected: selected,
                    setSelected: setSelected,
                    onLongPress: onRemove
                })) : React.createElement('div', { className: 'empty-state' }, 
                    'no subjects left 👀', 
                    React.createElement('br'), 
                    'add one to start ✿'
                )
            )
        ),

        React.createElement('div', { className: 'card text-center', onClick: () => setScreen('focus'), style: {cursor: 'pointer'} },
            React.createElement('div', { className: 'timer-big' }, formatTime(time)),
            React.createElement('div', { style: {marginTop: '-20px', opacity: 0.5, fontSize: '14px'} }, 'tap to expand')
        ),

        React.createElement('div', { className: 'controls' },
            React.createElement('button', { className: `btn ${running ? '' : 'btn-primary'}`, onClick: () => { setRunning(!running); playSound('clickSound'); } }, 
                running ? '⏸ pause' : '▶ start'
            ),
            React.createElement('button', { className: 'btn', onClick: () => { setRunning(false); setTime(1500); playSound('clickSound'); } }, '↺ reset')
        ),

        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'goal-section' },
                React.createElement('div', { className: 'goal-info' }, 
                    React.createElement('span', null, 'daily goal'),
                    React.createElement('span', null, `${todayMinutes}/${dailyGoal} min`)
                ),
                React.createElement('div', { className: 'progress-container' },
                    React.createElement('div', { className: 'progress-fill', style: { width: `${Math.min((todayMinutes / dailyGoal) * 100, 100)}%` } })
                ),
                React.createElement('div', { style: {textAlign: 'right'} },
                    React.createElement('input', {
                        type: 'number',
                        value: dailyGoal,
                        onChange: (e) => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1)),
                        style: { width: '50px', border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 'bold', fontFamily: 'inherit' }
                    }),
                    ' min'
                )
            )
        ),

        React.createElement('div', { className: 'card text-center' },
            React.createElement('span', { style: { fontSize: '24px' } }, '🔥 streak: ', streak, ' days')
        ),

        React.createElement('div', { className: 'footer' }, 'built by a backbencher lol 😼.')
    );
};

const SubjectChip = ({ s, selected, setSelected, onLongPress }) => {
    const [removing, setRemoving] = useState(false);
    
    // We handle the local "removing" state for the fade-out animation
    const handleLongPress = () => {
        onLongPress(s, () => setRemoving(true));
    };

    const longPressProps = useLongPress(handleLongPress, () => {
        setSelected(s);
        playSound('clickSound');
    });

    return React.createElement('div', {
        className: `sub ${selected === s ? 'active' : ''} ${removing ? 'removing' : ''}`,
        ...longPressProps
    }, s);
};

// --- MAIN APP ---
const App = () => {
    const [screen, setScreen] = useState("home");
    
    // Lifted State for Optimization
    const [subjects, setSubjects] = useState(safeJSON("subjects", ["science", "math"]));
    const [selected, setSelected] = useState(subjects[0]);
    const [time, setTime] = useState(1500);
    const [running, setRunning] = useState(false);
    
    const [streak, setStreak] = useState(Number(localStorage.getItem("streak")) || 0);
    const [lastStudy, setLastStudy] = useState(localStorage.getItem("lastStudy") || "");
    const [dailyGoal, setDailyGoal] = useState(Number(localStorage.getItem("dailyGoal")) || 60);
    const [todayMinutes, setTodayMinutes] = useState(Number(localStorage.getItem("todayMinutes")) || 0);
    const [todayDate, setTodayDate] = useState(localStorage.getItem("todayDate") || "");

    // Initialization & Persistence
    useEffect(() => {
        const today = new Date().toDateString();
        if (todayDate !== today) {
            setTodayMinutes(0);
            setTodayDate(today);
            localStorage.setItem("todayDate", today);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("subjects", JSON.stringify(subjects));
        localStorage.setItem("streak", streak);
        localStorage.setItem("lastStudy", lastStudy);
        localStorage.setItem("dailyGoal", dailyGoal);
        localStorage.setItem("todayMinutes", todayMinutes);
    }, [subjects, streak, lastStudy, dailyGoal, todayMinutes]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (running && time > 0) {
            interval = setInterval(() => {
                setTime(t => t - 1);
            }, 1000);
        } else if (time === 0) {
            setRunning(false);
            completeSession();
            setTime(1500);
        }
        return () => clearInterval(interval);
    }, [running, time]);

    const completeSession = () => {
        playSound('doneSound');
        const today = new Date().toDateString();
        
        if (lastStudy !== today) {
            setStreak(s => s + 1);
            setLastStudy(today);
        }
        
        setTodayMinutes(m => m + 25);
        
        const day = new Date().toLocaleDateString("en-US", { weekday: "short" });
        const weekly = safeJSON("weekly", {});
        weekly[day] = (weekly[day] || 0) + 25;
        localStorage.setItem("weekly", JSON.stringify(weekly));
        
        // Notification attempt
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Session Complete!", { body: "Great job! Time for a break." });
        }
    };

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const sharedProps = {
        screen, setScreen,
        time, setTime,
        running, setRunning,
        formatTime,
        subjects, setSubjects,
        selected, setSelected,
        streak, dailyGoal, setDailyGoal, todayMinutes
    };

    const [modal, setModal] = useState({ open: false, subject: '', copy: copyOptions[0], onConfirm: null });
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const confirmRemove = (sub, animateOut) => {
        const copy = copyOptions[Math.floor(Math.random() * copyOptions.length)];
        setModal({
            open: true,
            subject: sub,
            copy: copy,
            onConfirm: () => {
                animateOut();
                setTimeout(() => {
                    setSubjects(prev => {
                        const next = prev.filter(s => s !== sub);
                        if (selected === sub) setSelected(next[0] || '');
                        return next;
                    });
                    showToast(`${sub} removed ✿`);
                }, 300);
                setModal({ ...modal, open: false });
            }
        });
    };

    return React.createElement('div', { className: `app screen-${screen}` },
        screen === "home" && React.createElement(Home, { 
            ...sharedProps,
            onRemove: confirmRemove
        }),
        screen === "focus" && React.createElement(Focus, sharedProps),
        screen === "stats" && React.createElement(Stats, sharedProps),

        // Modal
        modal.open && React.createElement('div', { className: 'modal-overlay', onClick: () => setModal({ ...modal, open: false }) },
            React.createElement('div', { className: 'modal', onClick: e => e.stopPropagation() },
                React.createElement('div', { className: 'modal-title' }, modal.copy.text(modal.subject)),
                React.createElement('div', { className: 'modal-btns' },
                    React.createElement('button', { className: 'btn', onClick: () => setModal({ ...modal, open: false }) }, modal.copy.no),
                    React.createElement('button', { className: 'btn btn-primary', onClick: modal.onConfirm }, modal.copy.yes)
                )
            )
        ),

        // Toast
        toast && React.createElement('div', { className: 'toast' }, toast)
    );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
