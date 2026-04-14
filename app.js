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

const Focus = ({ setScreen, time, running, setRunning, setTime, formatTime, mode }) => {
    return React.createElement('div', { className: 'focus-screen' },
        React.createElement('div', { className: 'focus-header' },
            React.createElement('button', { className: 'btn', onClick: () => setScreen('home') }, '← back'),
            React.createElement('div', { className: 'logo' }, mode === "work" ? 'focus.' : 'break.')
        ),
        React.createElement('div', { className: 'focus-body' },
            React.createElement('div', { className: `focus-circle ${running ? 'running' : ''}` },
                React.createElement('div', { className: 'focus-time' }, formatTime(time))
            ),
            React.createElement('div', { className: 'focus-pet' },
                mode === "work"
                    ? (time > 900 ? "🐣" : (time > 300 ? "🐥" : "🐤"))
                    : "☕"
            ),
            React.createElement('div', { className: 'controls' },
                React.createElement('button', {
                    className: `btn ${running ? '' : 'btn-primary'}`,
                    onClick: () => setRunning(!running)
                }, running ? '⏸ pause' : '▶ start'),
                React.createElement('button', {
                    className: 'btn',
                    onClick: () => {
                        setRunning(false);
                        setTime(mode === "work"
                            ? (Number(localStorage.getItem("customTime")) || 1500)
                            : 300
                        );
                    }
                }, '↺ reset')
            )
        )
    );
};

const Home = (props) => {
    const {
        setScreen, time, running, setRunning, setTime, formatTime,
        subjects, setSubjects, selected, setSelected,
        streak, dailyGoal, setDailyGoal, todayMinutes,
        onRemove, mode, cycle
    } = props;

    return React.createElement('div', { className: 'content' },

        React.createElement('div', { className: 'topbar' },
            React.createElement('div', { className: 'logo' }, 'studii.'),
            React.createElement('div', { className: 'topbar-actions' },

                React.createElement('div', {
                    className: 'profile-btn',
                    onClick: () => {
                        const subject = selected?.name || "";
                        window.location.href = `https://krhhzv.github.io/studii-book/?subject=${encodeURIComponent(subject)}`;
                    }
                }, '📓'),

                React.createElement('div', {
                    className: 'profile-btn',
                    onClick: () => setScreen('stats')
                }, '📊')
            )
        ),

        React.createElement('div', { className: 'card text-center', onClick: () => setScreen('focus'), style: {cursor: 'pointer'} },
            React.createElement('div', {
                className: `timer-big ${mode === "break" ? 'timer-break' : ''}`
            }, formatTime(time)),

            React.createElement('div', { className: 'timer-status' },
                mode === "work"
                    ? `focus ✿ cycle ${cycle}`
                    : "break ☕ take it slow"
            )
        ),

        React.createElement('div', { className: 'controls' },
            React.createElement('button', {
                className: `btn ${running ? '' : 'btn-primary'}`,
                onClick: () => { setRunning(!running); playSound('clickSound'); }
            }, running ? '⏸ pause' : '▶ start'),

            React.createElement('button', {
                className: 'btn',
                onClick: () => {
                    setRunning(false);
                    setTime(mode === "work"
                        ? (Number(localStorage.getItem("customTime")) || 1500)
                        : 300
                    );
                }
            }, '↺ reset')
        ),

        React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-title' }, 'session time ✿'),

            React.createElement('input', {
                className: 'time-input',
                type: 'number',
                min: 1,
                max: 240,
                value: Math.floor(time / 60),
                onChange: (e) => {
                    const val = Math.min(240, Math.max(1, parseInt(e.target.value) || 1));
                    setTime(val * 60);
                }
            }),

            React.createElement('div', { className: 'soft-note' },
                Math.floor(time / 60) > 120
                    ? "that’s a long session… don’t forget to breathe ✿"
                    : "steady pace is enough ✿"
            )
        )
    );
};

// --- MAIN APP ---
const App = () => {

    const [mode, setMode] = useState("work");
    const [cycle, setCycle] = useState(1);

    const [screen, setScreen] = useState("home");

    const [subjects, setSubjects] = useState(() => safeJSON("subjects", []));
    const [selected, setSelected] = useState(subjects[0] || null);

    const [time, setTime] = useState(Number(localStorage.getItem("customTime")) || 1500);
    const [running, setRunning] = useState(false);

    const [streak, setStreak] = useState(Number(localStorage.getItem("streak")) || 0);
    const [lastStudy, setLastStudy] = useState(localStorage.getItem("lastStudy") || "");

    const [dailyGoal, setDailyGoal] = useState(Number(localStorage.getItem("dailyGoal")) || 60);
    const [todayMinutes, setTodayMinutes] = useState(Number(localStorage.getItem("todayMinutes")) || 0);
    const [todayDate, setTodayDate] = useState(localStorage.getItem("todayDate") || "");

    useEffect(() => {
        const today = new Date().toDateString();
        if (todayDate !== today) {
            setTodayMinutes(0);
            setTodayDate(today);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("subjects", JSON.stringify(subjects));
    }, [subjects]);

    useEffect(() => {
        let interval;

        if (running && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            handleSessionEnd();
        }

        return () => clearInterval(interval);
    }, [running, time]);

    const handleSessionEnd = () => {
        setRunning(false);

        if (mode === "work") {
            completeSession();

            const nextCycle = cycle + 1;
            setCycle(nextCycle);

            const isLongBreak = nextCycle % 4 === 0;
            setTime(isLongBreak ? 900 : 300);
            setMode("break");
        } else {
            setTime(Number(localStorage.getItem("customTime")) || 1500);
            setMode("work");
        }
    };

    useEffect(() => {
        if (mode === "work") {
            localStorage.setItem("customTime", time);
        }
    }, [time]);

    const completeSession = () => {
        playSound('doneSound');
        setTodayMinutes(m => m + 25);
    };

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return React.createElement('div', { className: `app ${mode === "break" ? 'break-mode' : ''}` },
        screen === "home" && React.createElement(Home, {
            setScreen, time, running, setRunning, setTime,
            formatTime, subjects, setSubjects, selected, setSelected,
            streak, dailyGoal, setDailyGoal, todayMinutes,
            mode, cycle
        }),
        screen === "focus" && React.createElement(Focus, {
            setScreen, time, running, setRunning, setTime, formatTime, mode
        }),
        screen === "stats" && React.createElement(Stats, { setScreen })
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
