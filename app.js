import React, { useState, useEffect, useRef } from 'https://esm.sh/react';
import ReactDOM from 'https://esm.sh/react-dom/client';



/* ================= UTILS ================= */

const cleanInput = (t) => {
    return t.replace(/[<>]/g, "");
};


const limitText = (t) => {
    return t.slice(0, 20);
};


const safeJSON = (k, f) => {
    try {
        const data = JSON.parse(localStorage.getItem(k));
        return data || f;
    } catch {
        return f;
    }
};


const playSound = (id) => {
    const el = document.getElementById(id);

    if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
    }
};


const formatTime = (t) => {

    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
};



/* ================= LONG PRESS ================= */

const useLongPress = (onLongPress, onClick, { delay = 500 } = {}) => {

    const [start, setStart] = useState(false);
    const ref = useRef();

    useEffect(() => {

        if (start) {
            ref.current = setTimeout(onLongPress, delay);
        } else {
            clearTimeout(ref.current);
        }

        return () => clearTimeout(ref.current);

    }, [start]);

    return {
        onMouseDown: () => setStart(true),
        onMouseUp: () => setStart(false),
        onMouseLeave: () => setStart(false),

        onTouchStart: () => setStart(true),
        onTouchEnd: () => setStart(false),

        onClick
    };
};



/* ================= SUBJECT CHIP ================= */

const SubjectChip = ({
    s,
    selected,
    setSelected,
    onRemove
}) => {

    const [removing, setRemoving] = useState(false);


    const handleLong = () => {

        if (confirm(`remove "${s.name}"?`)) {

            setRemoving(true);

            setTimeout(() => {
                onRemove(s);
            }, 200);
        }
    };


    const longPress = useLongPress(
        handleLong,
        () => {
            setSelected(s);
            playSound("clickSound");
        }
    );


    return React.createElement(

        "div",

        {
            className: `
                sub 
                ${selected?.id === s.id ? "active" : ""} 
                ${removing ? "removing" : ""}
            `,

            ...longPress
        },

        s.name
    );
};



/* ================= STATS ================= */

const Stats = ({ setScreen }) => {

    const weekly = safeJSON("weekly", {});

    const days = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];


    const values = days.map(d => weekly[d] || 0);

    const max = Math.max(...values, 60);

    const total = values.reduce((a, b) => a + b, 0);


    return React.createElement(

        "div",
        { className: "content" },

        /* HEADER */
        React.createElement(
            "div",
            { className: "topbar" },

            React.createElement(
                "div",
                { className: "logo" },
                "stats"
            ),

            React.createElement(
                "div",
                {
                    className: "profile-btn",
                    onClick: () => setScreen("home")
                },
                "←"
            )
        ),


        /* GRAPH CARD */
        React.createElement(
            "div",
            { className: "card" },

            React.createElement(
                "div",
                { className: "card-title" },
                "weekly progress"
            ),

            React.createElement(
                "div",
                { className: "graph" },

                days.map((d, i) => {

                    return React.createElement(

                        "div",
                        {
                            key: d,
                            className: "bar-wrap"
                        },

                        React.createElement(
                            "div",
                            {
                                className: "bar",
                                style: {
                                    height: `${(values[i] / max) * 100}%`
                                }
                            }
                        ),

                        React.createElement(
                            "div",
                            { className: "bar-label" },
                            d
                        )
                    );
                })
            )
        ),


        /* TOTAL */
        React.createElement(
            "div",
            { className: "card" },
            `total: ${total} min`
        )
    );
};



/* ================= FOCUS ================= */

const Focus = ({
    setScreen,
    time,
    running,
    setRunning,
    setTime,
    xp,
    setXP
}) => {

    const pet =
        xp < 50 ? "🥚" :
        xp < 150 ? "🐣" :
        xp < 300 ? "🐥" :
        "🐤";


    return React.createElement(

        "div",
        { className: "focus-screen" },


        /* HEADER */
        React.createElement(
            "div",
            { className: "focus-header" },

            React.createElement(
                "button",
                {
                    className: "btn",
                    onClick: () => setScreen("home")
                },
                "←"
            ),

            React.createElement(
                "div",
                { className: "logo" },
                "focus."
            )
        ),


        /* BODY */
        React.createElement(
            "div",
            { className: "focus-body" },

            React.createElement(
                "div",
                {
                    className: `
                        focus-circle 
                        ${running ? "running" : ""}
                    `
                },

                React.createElement(
                    "div",
                    { className: "focus-time" },
                    formatTime(time)
                )
            ),


            React.createElement(
                "div",
                {
                    className: "focus-pet",
                    onClick: () => {

                        setXP(x => {
                            const n = x + 1;
                            localStorage.setItem("xp", n);
                            return n;
                        });
                    }
                },
                pet
            ),


            React.createElement(
                "div",
                { className: "controls" },

                React.createElement(
                    "button",
                    {
                        className: `btn ${running ? "" : "btn-primary"}`,
                        onClick: () => setRunning(!running)
                    },
                    running ? "⏸ pause" : "▶ start"
                ),

                React.createElement(
                    "button",
                    {
                        className: "btn",
                        onClick: () => {
                            setRunning(false);
                            setTime(1500);
                        }
                    },
                    "↺ reset"
                )
            )
        )
    );
};



/* ================= MAIN ================= */

const App = () => {

    const [screen, setScreen] = useState("home");


    const [subjects, setSubjects] = useState(
        safeJSON("subjects", [
            { id: "1", name: "science" },
            { id: "2", name: "math" }
        ])
    );


    const [selected, setSelected] = useState(subjects[0]);


    const [time, setTime] = useState(1500);
    const [running, setRunning] = useState(false);


    const [mode, setMode] = useState("work");
    const [cycle, setCycle] = useState(0);


    const [xp, setXP] = useState(
        Number(localStorage.getItem("xp")) || 0
    );


    const [streak, setStreak] = useState(
        Number(localStorage.getItem("streak")) || 0
    );


    const [lastStudy, setLastStudy] = useState(
        localStorage.getItem("lastStudy") || ""
    );


    const [todayMinutes, setTodayMinutes] = useState(
        Number(localStorage.getItem("todayMinutes")) || 0
    );


    const [dailyGoal, setDailyGoal] = useState(
        Number(localStorage.getItem("dailyGoal")) || 60
    );


    const [editingTime, setEditingTime] = useState(false);

    const MAX_TIME = 21600;



    /* SAVE */
    useEffect(() => {

        localStorage.setItem("subjects", JSON.stringify(subjects));
        localStorage.setItem("streak", streak);
        localStorage.setItem("todayMinutes", todayMinutes);
        localStorage.setItem("dailyGoal", dailyGoal);

    }, [
        subjects,
        streak,
        todayMinutes,
        dailyGoal
    ]);



    /* TIMER */
    useEffect(() => {

        let interval;

        if (running && time > 0) {

            interval = setInterval(() => {
                setTime(t => t - 1);
            }, 1000);
        }


        if (time === 0) {

            setRunning(false);
            playSound("doneSound");


            if (mode === "work") {

                const c = cycle + 1;
                setCycle(c);

                setTodayMinutes(m => m + 25);


                setXP(x => {
                    const n = x + 10;
                    localStorage.setItem("xp", n);
                    return n;
                });


                const today = new Date().toDateString();

                if (lastStudy !== today) {

                    const y = new Date();
                    y.setDate(y.getDate() - 1);

                    if (lastStudy === y.toDateString()) {
                        setStreak(s => s + 1);
                    } else {
                        setStreak(1);
                    }

                    setLastStudy(today);
                    localStorage.setItem("lastStudy", today);
                }


                const day = new Date().toLocaleDateString(
                    "en-US",
                    { weekday: "short" }
                );

                const weekly = safeJSON("weekly", {});

                weekly[day] = (weekly[day] || 0) + 25;

                localStorage.setItem("weekly", JSON.stringify(weekly));


                if (c % 2 === 0) {
                    setMode("long");
                    setTime(900);
                } else {
                    setMode("short");
                    setTime(300);
                }

            } else {

                setMode("work");
                setTime(1500);
            }
        }

        return () => clearInterval(interval);

    }, [running, time]);



    /* CUSTOM TIME */
    const applyCustomTime = (min) => {

        const sec = Math.min(
            MAX_TIME,
            Math.max(60, min * 60)
        );

        setTime(sec);
        setMode("work");
        setCycle(0);
    };



    /* NAV */
    if (screen === "stats") {
        return React.createElement(Stats, { setScreen });
    }

    if (screen === "focus") {
        return React.createElement(
            Focus,
            {
                setScreen,
                time,
                running,
                setRunning,
                setTime,
                xp,
                setXP
            }
        );
    }



    /* HOME */
    return React.createElement(

        "div",
        { className: "app" },


        /* HEADER */
        React.createElement(
            "div",
            { className: "topbar" },

            React.createElement(
                "div",
                { className: "logo" },
                "studii."
            ),

            React.createElement(
                "div",
                {
                    className: "profile-btn",
                    onClick: () => setScreen("stats")
                },
                "📊"
            )
        ),


        /* CONTENT */
        React.createElement(
            "div",
            { className: "content" },


            /* SUBJECTS */
            React.createElement(
                "div",
                { className: "card" },

                React.createElement(
                    "div",
                    { className: "card-title" },
                    "subjects"
                ),

                React.createElement(
                    "div",
                    { className: "subjects" },

                    subjects.map(s =>
                        React.createElement(
                            SubjectChip,
                            {
                                key: s.id,
                                s,
                                selected,
                                setSelected,

                                onRemove: (sub) => {
                                    setSubjects(
                                        subjects.filter(
                                            x => x.id !== sub.id
                                        )
                                    );
                                }
                            }
                        )
                    )
                )
            ),


            /* TIMER */
            React.createElement(
                "div",
                { className: "card text-center" },

                editingTime
                    ? React.createElement(
                        "input",
                        {
                            className: "timer-input",
                            type: "number",
                            defaultValue: Math.floor(time / 60),

                            onBlur: (e) => {
                                applyCustomTime(Number(e.target.value));
                                setEditingTime(false);
                            },

                            onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                    applyCustomTime(Number(e.target.value));
                                    setEditingTime(false);
                                }
                            }
                        }
                    )
                    : React.createElement(
                        "div",
                        {
                            className: "timer-big",
                            onClick: () => setEditingTime(true)
                        },
                        formatTime(time)
                    )
            ),


            /* CONTROLS */
            React.createElement(
                "div",
                { className: "controls" },

                React.createElement(
                    "button",
                    {
                        className: `btn ${running ? "" : "btn-primary"}`,

                        onClick: () => {
                            setRunning(!running);
                            playSound("clickSound");
                        }
                    },
                    running ? "⏸ pause" : "▶ start"
                ),

                React.createElement(
                    "button",
                    {
                        className: "btn",
                        onClick: () => {
                            setRunning(false);
                            setTime(1500);
                        }
                    },
                    "↺ reset"
                )
            ),


            /* GOAL */
            React.createElement(
                "div",
                { className: "card" },
                `daily goal ${todayMinutes}/${dailyGoal} min`
            ),


            /* STREAK */
            React.createElement(
                "div",
                { className: "card" },
                `🔥 streak: ${streak} days`
            ),


            /* FOOTER */
            React.createElement(
                "div",
                { className: "footer" },
                "built by a backbencher lol 😼."
            )
        )
    );
};



/* ================= RENDER ================= */

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    React.createElement(App)
);
