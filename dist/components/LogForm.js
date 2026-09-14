import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";
import { addLog, deleteLog, subscribeLogsForProfile, subscribeInbodyLogsForProfile } from "../store.js";
import { LineChart } from "./Chart.js";
import { firestoreErrorNotice, isAssistableExercise, nearestWeightForDate } from "../utils.js";
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
    const [inbodyLogs, setInbodyLogs] = useState([]);
    const [date, setDate] = useState(todayStr());
    const [sets, setSets] = useState([{ reps: "", weight: "" }]);
    const [duration, setDuration] = useState("");
    const [distance, setDistance] = useState("");
    const [incline, setIncline] = useState("");
    const [calories, setCalories] = useState("");
    const [assisted, setAssisted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    useEffect(() => {
        return subscribeLogsForProfile(profileId, setAllLogs, setLoadError);
    }, [profileId]);
    useEffect(() => {
        return subscribeInbodyLogsForProfile(profileId, setInbodyLogs, setLoadError);
    }, [profileId]);
    const logsForThis = allLogs.filter((l) => l.exerciseId === exercise.id);
    const isCardio = exercise.type === "cardio";
    // 딥스/풀업 같은 어시스트 머신 운동: 체크하면 "무게"란에 어시스트 무게(카운터
    // 웨이트)를 입력하고, 그 날짜와 가장 가까운 인바디 체중에서 빼서 실제 든 무게로
    // 자동 계산해요.
    const isAssistable = isAssistableExercise(exercise);
    const bodyweightForDate = nearestWeightForDate(inbodyLogs, date);
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
        setSaveError(null);
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
                const useAssist = isAssistable && assisted;
                if (useAssist && bodyweightForDate == null) {
                    setSaveError("인바디 체중 기록이 없어서 어시스트 무게를 자동 계산할 수 없어요. 인바디 탭에서 몸무게를 먼저 기록해주세요.");
                    setSaving(false);
                    return;
                }
                const cleanSets = sets
                    .filter((s) => s.reps !== "" && s.weight !== "")
                    .map((s) => {
                    const reps = Number(s.reps);
                    const entered = Number(s.weight);
                    if (useAssist) {
                        return {
                            reps,
                            weight: Math.max(0, Math.round((bodyweightForDate - entered) * 10) / 10),
                            assistWeight: entered,
                            bodyweightUsed: bodyweightForDate,
                        };
                    }
                    return { reps, weight: entered };
                });
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
                    assisted: useAssist,
                });
                setSets([{ reps: "", weight: "" }]);
            }
        }
        catch (err) {
            setSaveError(`저장에 실패했어요. (${err && err.message ? err.message : "알 수 없는 오류"})`);
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
    return React.createElement("div", { className: "log-form-view" }, React.createElement("button", { className: "back-btn", onClick: onClose }, "← 목록으로"), React.createElement("h2", null, exercise.name), React.createElement("p", { className: "muted" }, `${exercise.category} · ${isCardio ? "유산소" : "근력"}`), loadError &&
        (() => {
            const notice = firestoreErrorNotice(loadError);
            return React.createElement("div", { className: "note-box", style: { borderColor: "var(--danger)" } }, notice.message, notice.link &&
                React.createElement("a", { href: notice.link, target: "_blank", rel: "noreferrer", style: { display: "block", marginTop: 6, color: "var(--accent)" } }, "→ 색인 만들러 가기"));
        })(), React.createElement("form", { className: "log-entry-form", onSubmit: handleSave }, React.createElement("label", null, "날짜"), React.createElement("input", {
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
        : React.createElement("div", { className: "sets-editor" }, isAssistable &&
            React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, margin: "4px 0 10px", fontWeight: "normal" } }, React.createElement("input", {
                type: "checkbox",
                checked: assisted,
                onChange: (e) => setAssisted(e.target.checked),
            }), "어시스트 머신으로 했어요 (무게란에 어시스트 무게 입력)"), isAssistable &&
            assisted &&
            React.createElement("p", { className: "muted", style: { fontSize: "12px", marginBottom: 8 } }, bodyweightForDate != null
                ? `${date} 기준 체중 ${bodyweightForDate}kg에서 어시스트 무게를 뺀 값이 자동 저장돼요.`
                : "인바디 체중 기록이 없어서 자동 계산이 안 돼요. 인바디 탭에서 몸무게를 먼저 기록해주세요."), React.createElement("div", { className: "sets-header" }, React.createElement("span", null, "세트"), React.createElement("span", null, "횟수"), React.createElement("span", null, isAssistable && assisted ? "어시스트 무게 (kg)" : "무게 (kg)")), sets.map((s, i) => React.createElement("div", { className: "set-row", key: i }, React.createElement("span", { className: "set-index" }, i + 1), React.createElement("input", {
            type: "number",
            min: 0,
            value: s.reps,
            onChange: (e) => updateSet(i, "reps", e.target.value),
            placeholder: "10",
        }), React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, minWidth: 0 } }, React.createElement("input", {
            type: "number",
            min: 0,
            step: "0.5",
            value: s.weight,
            onChange: (e) => updateSet(i, "weight", e.target.value),
            placeholder: isAssistable && assisted ? "30" : "40",
        }), isAssistable &&
            assisted &&
            bodyweightForDate != null &&
            s.weight !== "" &&
            React.createElement("span", { className: "muted", style: { fontSize: "12px", whiteSpace: "nowrap" } }, `→${Math.max(0, Math.round((bodyweightForDate - Number(s.weight)) * 10) / 10)}kg`)), sets.length > 1 &&
            React.createElement("button", {
                type: "button",
                className: "set-remove",
                onClick: () => removeSetRow(i),
            }, "✕"))), React.createElement("button", { type: "button", className: "add-set-btn", onClick: addSetRow }, "+ 세트 추가")), React.createElement("button", { type: "submit", className: "btn-primary save-btn", disabled: saving }, saving ? "저장 중..." : "기록 저장"), saveError && React.createElement("p", { style: { color: "var(--danger)", fontSize: "12px", marginTop: 8 } }, saveError)), React.createElement("h3", null, "최근 추이"), React.createElement(LineChart, {
        points: chartPoints,
        valueSuffix: isCardio ? "분" : "kg",
    }), React.createElement("h3", null, "기록 히스토리"), React.createElement("div", { className: "history-list" }, logsForThis.length === 0 &&
        React.createElement("p", { className: "muted" }, "아직 기록이 없어요."), logsForThis.map((l) => React.createElement("div", { key: l.id, className: "history-row" }, React.createElement("span", { className: "history-date" }, l.date), React.createElement("span", { className: "history-detail" }, isCardio
        ? `${l.durationMin}분${l.distanceKm ? ` · ${l.distanceKm}km` : ""}${l.incline ? ` · 경사 ${l.incline}%` : ""}${l.calories ? ` · ${l.calories}kcal` : ""}`
        : `${l.sets
            .map((s) => s.assistWeight != null
            ? `${s.weight}kg×${s.reps} (체중${s.bodyweightUsed}-어시스트${s.assistWeight})`
            : `${s.weight}kg×${s.reps}`)
            .join(", ")} (볼륨 ${l.volume})`), React.createElement("button", { className: "history-delete", onClick: () => deleteLog(l.id) }, "삭제")))));
}
