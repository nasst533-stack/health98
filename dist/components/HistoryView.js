import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { subscribeLogsForProfile, subscribeFoodLogsForProfile, deleteLog, updateLog, } from "../store.js";
import { LineChart } from "./Chart.jsx";
import { MonthCalendar } from "./Calendar.jsx";
import { todayStr, weekDates } from "../utils.js";
function EditLogModal({ log, onClose, onSave }) {
    const isCardio = log.type === "cardio";
    const [date, setDate] = useState(log.date);
    const [sets, setSets] = useState(isCardio
        ? [{ reps: "", weight: "" }]
        : log.sets.map((s) => ({ reps: String(s.reps), weight: String(s.weight) })));
    const [duration, setDuration] = useState(isCardio ? String(log.durationMin || "") : "");
    const [distance, setDistance] = useState(isCardio && log.distanceKm != null ? String(log.distanceKm) : "");
    const [incline, setIncline] = useState(isCardio && log.incline != null ? String(log.incline) : "");
    const [calories, setCalories] = useState(isCardio && log.calories != null ? String(log.calories) : "");
    function updateSet(i, field, value) {
        setSets((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: value };
            return next;
        });
    }
    function addSetRow() {
        setSets((prev) => [...prev, { reps: "", weight: "" }]);
    }
    function removeSetRow(i) {
        setSets((prev) => prev.filter((_, idx) => idx !== i));
    }
    function handleSubmit(e) {
        e.preventDefault();
        if (isCardio) {
            onSave({
                ...log,
                date,
                durationMin: Number(duration) || 0,
                distanceKm: distance === "" ? null : Number(distance),
                incline: incline === "" ? null : Number(incline),
                calories: calories === "" ? null : Number(calories),
            });
        }
        else {
            const clean = sets
                .filter((s) => s.reps !== "" && s.weight !== "")
                .map((s) => ({ reps: Number(s.reps), weight: Number(s.weight) }));
            if (clean.length === 0)
                return;
            const volume = clean.reduce((sum, s) => sum + s.reps * s.weight, 0);
            onSave({ ...log, date, sets: clean, volume });
        }
    }
    return React.createElement("div", { className: "modal-backdrop", onClick: onClose }, React.createElement("form", { className: "modal", onClick: (e) => e.stopPropagation(), onSubmit: handleSubmit }, React.createElement("h2", null, `${log.exerciseName} 수정`), React.createElement("label", null, "날짜"), React.createElement("input", {
        type: "date",
        value: date,
        onChange: (e) => setDate(e.target.value),
    }), isCardio
        ? React.createElement(React.Fragment, null, React.createElement("label", null, "시간 (분)"), React.createElement("input", {
            type: "number",
            min: 0,
            value: duration,
            onChange: (e) => setDuration(e.target.value),
        }), React.createElement("label", null, "거리 (km, 선택)"), React.createElement("input", {
            type: "number",
            step: "0.01",
            value: distance,
            onChange: (e) => setDistance(e.target.value),
        }), React.createElement("label", null, "경사 (%, 선택)"), React.createElement("input", {
            type: "number",
            step: "0.1",
            value: incline,
            onChange: (e) => setIncline(e.target.value),
        }), React.createElement("label", null, "칼로리 (kcal, 선택)"), React.createElement("input", {
            type: "number",
            value: calories,
            onChange: (e) => setCalories(e.target.value),
        }))
        : React.createElement("div", null, React.createElement("div", { className: "sets-header" }, React.createElement("span", null, "#"), React.createElement("span", null, "횟수"), React.createElement("span", null, "무게(kg)"), React.createElement("span", null)), sets.map((s, i) => React.createElement("div", { className: "set-row", key: i }, React.createElement("span", { className: "set-index" }, i + 1), React.createElement("input", {
            type: "number",
            min: 0,
            value: s.reps,
            onChange: (e) => updateSet(i, "reps", e.target.value),
        }), React.createElement("input", {
            type: "number",
            min: 0,
            step: "0.5",
            value: s.weight,
            onChange: (e) => updateSet(i, "weight", e.target.value),
        }), sets.length > 1
            ? React.createElement("button", { type: "button", className: "set-remove", onClick: () => removeSetRow(i) }, "✕")
            : React.createElement("span", null))), React.createElement("button", { type: "button", className: "add-set-btn", onClick: addSetRow }, "+ 세트 추가")), React.createElement("div", { className: "modal-actions" }, React.createElement("button", { type: "button", className: "btn-secondary", onClick: onClose }, "취소"), React.createElement("button", { type: "submit", className: "btn-primary" }, "저장"))));
}
export function HistoryView({ profileId }) {
    const [logs, setLogs] = useState([]);
    const [foodLogs, setFoodLogs] = useState([]);
    useEffect(() => {
        return subscribeLogsForProfile(profileId, setLogs);
    }, [profileId]);
    useEffect(() => {
        return subscribeFoodLogsForProfile(profileId, setFoodLogs);
    }, [profileId]);
    const strengthLogs = logs.filter((l) => l.type === "strength");
    const todayLogs = logs.filter((l) => l.date === todayStr());
    const todayVolume = todayLogs
        .filter((l) => l.type === "strength")
        .reduce((s, l) => s + (l.volume || 0), 0);
    const now = new Date();
    const [monthState, setMonthState] = useState({ y: now.getFullYear(), m: now.getMonth() });
    const [selectedDate, setSelectedDate] = useState(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingLog, setEditingLog] = useState(null);
    function prevMonth() {
        setMonthState((cur) => {
            let m = cur.m - 1, y = cur.y;
            if (m < 0) {
                m = 11;
                y -= 1;
            }
            return { y, m };
        });
    }
    function nextMonth() {
        setMonthState((cur) => {
            let m = cur.m + 1, y = cur.y;
            if (m > 11) {
                m = 0;
                y += 1;
            }
            return { y, m };
        });
    }
    function prevWeek() {
        setWeekOffset((w) => w + 1);
    }
    function nextWeek() {
        setWeekOffset((w) => Math.max(0, w - 1));
    }
    const volumeByDate = useMemo(() => {
        const m = {};
        strengthLogs.forEach((l) => { m[l.date] = (m[l.date] || 0) + (l.volume || 0); });
        return m;
    }, [logs]);
    const kcalByDate = useMemo(() => {
        const m = {};
        foodLogs.forEach((l) => { m[l.date] = (m[l.date] || 0) + (l.kcal || 0); });
        return m;
    }, [foodLogs]);
    const weekDatesArr = useMemo(() => weekDates(weekOffset), [weekOffset]);
    const dailyVolume = weekDatesArr.map((date) => ({ label: date.slice(5), value: volumeByDate[date] || 0 }));
    const dailyKcal = weekDatesArr.map((date) => ({ label: date.slice(5), value: kcalByDate[date] || 0 }));
    const weekLabel = `${weekDatesArr[0].slice(5)} ~ ${weekDatesArr[6].slice(5)}${weekOffset === 0 ? " (이번 주)" : ""}`;
    const sortedLogs = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
    const shownLogs = selectedDate ? sortedLogs.filter((l) => l.date === selectedDate) : sortedLogs;
    const recordListBlock = React.createElement(React.Fragment, { key: "records" }, React.createElement("h2", null, selectedDate ? `${selectedDate} 기록` : "전체 기록"), selectedDate &&
        React.createElement("div", { className: "cal-filter-note" }, React.createElement("span", null, "달력에서 날짜를 선택해 그날 기록만 볼 수 있어요."), React.createElement("button", { type: "button", onClick: () => setSelectedDate(null) }, "전체보기")), React.createElement("div", { className: "history-list" }, shownLogs.length === 0 &&
        React.createElement("p", { className: "muted" }, selectedDate ? "이 날짜엔 기록이 없어요." : "아직 기록이 없어요. '운동' 탭에서 첫 기록을 남겨보세요."), shownLogs.map((l) => React.createElement("div", { className: "history-row", key: l.id }, React.createElement("div", null, React.createElement("span", { className: "history-date" }, l.date), React.createElement("strong", { className: "history-exname" }, ` ${l.exerciseName}`), React.createElement("div", { className: "history-detail" }, l.type === "cardio"
        ? `${l.durationMin}분${l.distanceKm ? ` · ${l.distanceKm}km` : ""}`
        : `${(l.sets || []).map((s) => `${s.weight}kg×${s.reps}`).join(", ")} (볼륨 ${l.volume.toLocaleString()})`)), React.createElement("div", { className: "row-menu-wrap" }, React.createElement("button", {
        type: "button",
        className: "kebab-btn",
        "aria-label": "더보기",
        onClick: () => setOpenMenuId(openMenuId === l.id ? null : l.id),
    }, "⋮"), openMenuId === l.id &&
        React.createElement(React.Fragment, null, React.createElement("div", {
            className: "menu-backdrop",
            onClick: () => setOpenMenuId(null),
        }), React.createElement("div", { className: "menu-popover" }, React.createElement("button", {
            type: "button",
            onClick: () => { setEditingLog(l); setOpenMenuId(null); },
        }, "수정"), React.createElement("button", {
            type: "button",
            className: "danger",
            onClick: () => { deleteLog(l.id); setOpenMenuId(null); },
        }, "삭제"))))))));
    const chartsBlock = React.createElement(React.Fragment, { key: "charts" }, React.createElement("div", { className: "week-nav-row" }, React.createElement("button", { type: "button", className: "cal-nav-btn", onClick: prevWeek, "aria-label": "이전 주" }, "‹"), React.createElement("span", { className: "week-nav-label" }, weekLabel), React.createElement("button", {
        type: "button",
        className: "cal-nav-btn",
        onClick: nextWeek,
        disabled: weekOffset === 0,
        style: weekOffset === 0 ? { opacity: 0.35 } : null,
        "aria-label": "다음 주",
    }, "›")), React.createElement("h2", null, "일일 총 볼륨"), React.createElement(LineChart, { points: dailyVolume, valueSuffix: "kg" }), React.createElement("h2", null, "일일 섭취 칼로리"), React.createElement(LineChart, { points: dailyKcal, valueSuffix: "kcal", colorVar: "var(--accent-2)" }));
    return React.createElement("div", { className: "history-view" }, React.createElement("div", { className: "stat-row" }, React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "오늘 총 볼륨"), React.createElement("span", { className: "stat-value" }, todayVolume.toLocaleString(), React.createElement("em", null, " kg"))), React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "총 기록 수"), React.createElement("span", { className: "stat-value" }, logs.length, React.createElement("em", null, " 건")))), React.createElement("h2", null, "달력"), React.createElement(MonthCalendar, {
        year: monthState.y,
        month: monthState.m,
        volumeByDate,
        kcalByDate,
        selectedDate,
        onSelectDate: setSelectedDate,
        onPrevMonth: prevMonth,
        onNextMonth: nextMonth,
    }), selectedDate ? [recordListBlock, chartsBlock] : [chartsBlock, recordListBlock], editingLog &&
        React.createElement(EditLogModal, {
            log: editingLog,
            onClose: () => setEditingLog(null),
            onSave: (updated) => { updateLog(updated.id, updated); setEditingLog(null); },
        }));
}
