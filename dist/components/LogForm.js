import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";
import { addLog, deleteLog, subscribeLogsForProfile } from "../store.js";
import { LineChart } from "./Chart.js";
function todayStr() {
    // toISOString()은 UTC 기준이라 자정 근처에 한국 시간과 하루 어긋날 수 있어서
    // 로컬 타임존 기준으로 YYYY-MM-DD를 직접 만듭니다.
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
export function LogForm({ exercise, profileId, onClose }) {
    const [allLogs, setAllLogs] = useState([]);
    const [date, setDate] = useState(todayStr());
    const [sets, setSets] = useState([{ reps: "", weight: "" }]);
    const [duration, setDuration] = useState("");
    const [distance, setDistance] = useState("");
    const [incline, setIncline] = useState("");
    const [calories, setCalories] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        return subscribeLogsForProfile(profileId, setAllLogs);
    }, [profileId]);
    const logsForThis = allLogs.filter((l) => l.exerciseId === exercise.id);
    const isCardio = exercise.type === "cardio";
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
    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            if (isCardio) {
                await addLog({
                    profileId,
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    category: exercise.category,
                    type: "cardio",
                    date,
                    durationMin: Number(duration) || 0,
                    distanceKm: distance === "" ? null : Number(distance),
                    incline: incline === "" ? null : Number(incline),
                    calories: calories === "" ? null : Number(calories),
                });
                setDuration("");
                setDistance("");
                setIncline("");
                setCalories("");
            }
            else {
                const cleanSets = sets
                    .filter((s) => s.reps !== "" && s.weight !== "")
                    .map((s) => ({ reps: Number(s.reps), weight: Number(s.weight) }));
                if (cleanSets.length === 0) {
                    setSaving(false);
                    return;
                }
                const volume = cleanSets.reduce((sum, s) => sum + s.reps * s.weight, 0);
                await addLog({
                    profileId,
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    category: exercise.category,
                    type: "strength",
                    date,
                    sets: cleanSets,
                    volume,
                });
                setSets([{ reps: "", weight: "" }]);
            }
        }
        finally {
            setSaving(false);
        }
    }
    const chartPoints = [...logsForThis]
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .slice(-10)
        .map((l) => ({
        label: l.date.slice(5),
        value: isCardio ? l.durationMin || 0 : l.volume || 0,
    }));
    return React.createElement("div", { className: "log-form-view" }, React.createElement("button", { className: "back-btn", onClick: onClose }, "← 목록으로"), React.createElement("h2", null, exercise.name), React.createElement("p", { className: "muted" }, `${exercise.category} · ${isCardio ? "유산소" : "근력"}`), React.createElement("form", { className: "log-entry-form", onSubmit: handleSave }, React.createElement("label", null, "날짜"), React.createElement("input", {
        type: "date",
        value: date,
        onChange: (e) => setDate(e.target.value),
    }), isCardio
        ? React.createElement(React.Fragment, null, React.createElement("label", null, "시간 (분)"), React.createElement("input", {
            type: "number",
            min: 0,
            value: duration,
            onChange: (e) => setDuration(e.target.value),
            placeholder: "예: 30",
        }), React.createElement("label", null, "거리 (km, 선택)"), React.createElement("input", {
            type: "number",
            step: "0.01",
            value: distance,
            onChange: (e) => setDistance(e.target.value),
            placeholder: "예: 5.2",
        }), React.createElement("label", null, "경사 (%, 선택)"), React.createElement("input", {
            type: "number",
            step: "0.1",
            value: incline,
            onChange: (e) => setIncline(e.target.value),
            placeholder: "천국의 계단 등",
        }), React.createElement("label", null, "칼로리 (kcal, 선택)"), React.createElement("input", {
            type: "number",
            value: calories,
            onChange: (e) => setCalories(e.target.value),
            placeholder: "예: 300",
        }))
        : React.createElement("div", { className: "sets-editor" }, React.createElement("div", { className: "sets-header" }, React.createElement("span", null, "세트"), React.createElement("span", null, "횟수"), React.createElement("span", null, "무게 (kg)")), sets.map((s, i) => React.createElement("div", { className: "set-row", key: i }, React.createElement("span", { className: "set-index" }, i + 1), React.createElement("input", {
            type: "number",
            min: 0,
            value: s.reps,
            onChange: (e) => updateSet(i, "reps", e.target.value),
            placeholder: "10",
        }), React.createElement("input", {
            type: "number",
            min: 0,
            step: "0.5",
            value: s.weight,
            onChange: (e) => updateSet(i, "weight", e.target.value),
            placeholder: "40",
        }), sets.length > 1 &&
            React.createElement("button", {
                type: "button",
                className: "set-remove",
                onClick: () => removeSetRow(i),
            }, "✕"))), React.createElement("button", { type: "button", className: "add-set-btn", onClick: addSetRow }, "+ 세트 추가")), React.createElement("button", { type: "submit", className: "btn-primary save-btn", disabled: saving }, saving ? "저장 중..." : "기록 저장")), React.createElement("h3", null, "최근 추이"), React.createElement(LineChart, {
        points: chartPoints,
        valueSuffix: isCardio ? "분" : "kg",
    }), React.createElement("h3", null, "기록 히스토리"), React.createElement("div", { className: "history-list" }, logsForThis.length === 0 &&
        React.createElement("p", { className: "muted" }, "아직 기록이 없어요."), logsForThis.map((l) => React.createElement("div", { key: l.id, className: "history-row" }, React.createElement("span", { className: "history-date" }, l.date), React.createElement("span", { className: "history-detail" }, isCardio
        ? `${l.durationMin}분${l.distanceKm ? ` · ${l.distanceKm}km` : ""}${l.incline ? ` · 경사 ${l.incline}%` : ""}${l.calories ? ` · ${l.calories}kcal` : ""}`
        : `${l.sets.map((s) => `${s.weight}kg×${s.reps}`).join(", ")} (볼륨 ${l.volume})`), React.createElement("button", { className: "history-delete", onClick: () => deleteLog(l.id) }, "삭제")))));
}
