import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { subscribeInbodyLogsForProfile, subscribeLogsForProfile, subscribeFoodLogsForProfile, subscribeAppSettings, setGeminiKey as saveGeminiKeyToServer, addInbodyLog, deleteInbodyLog, setProfileGoal, } from "../store.js";
import { LineChart } from "./Chart.js";
import { todayStr, daysAgoStr, weekDates, avgMacroPercents, macroTargetPercents, buildRecommendation, } from "../utils.js";
export function InbodyTab({ profileId, goal, isMaster }) {
    const [inbodyLogs, setInbodyLogs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [foodLogs, setFoodLogs] = useState([]);
    useEffect(() => subscribeInbodyLogsForProfile(profileId, setInbodyLogs), [profileId]);
    useEffect(() => subscribeLogsForProfile(profileId, setLogs), [profileId]);
    useEffect(() => subscribeFoodLogsForProfile(profileId, setFoodLogs), [profileId]);
    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState(todayStr());
    const [weight, setWeight] = useState("");
    const [muscle, setMuscle] = useState("");
    const [fatPct, setFatPct] = useState("");
    const [fatMass, setFatMass] = useState("");
    const [bmi, setBmi] = useState("");
    const [score, setScore] = useState("");
    // Gemini API 키: 승인된 사람이면 누구나 같이 쓰지만, 넣고 바꾸는 건 마스터만 할 수 있어요.
    // 한 번 저장되면 입력칸은 다시 안 보이고, 마스터가 "설정 더보기 > API 키 수정"을 눌렀을 때만 나타나요.
    const [geminiKey, setGeminiKeyLocal] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [editingKey, setEditingKey] = useState(false);
    const [keyDraft, setKeyDraft] = useState("");
    const [question, setQuestion] = useState("");
    const [aiTip, setAiTip] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    // "체크" 버튼: 최근 7일 운동/식단 + 최신 인바디를 한번에 묶어서 AI가 주간 피드백을 줘요.
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [weeklyError, setWeeklyError] = useState(null);
    useEffect(() => {
        return subscribeAppSettings((settings) => {
            setGeminiKeyLocal(settings.geminiKey || "");
        });
    }, []);
    const hasSavedKey = !!geminiKey.trim();
    function openKeyEditor() {
        setKeyDraft(geminiKey);
        setEditingKey(true);
    }
    function saveKeyDraft() {
        saveGeminiKeyToServer(keyDraft.trim()).catch(() => {
            /* 저장 실패는 조용히 무시 - 다시 시도하면 됨 */
        });
        setEditingKey(false);
    }
    function clearKey() {
        saveGeminiKeyToServer("").catch(() => { });
        setKeyDraft("");
        setEditingKey(false);
    }
    const sorted = [...inbodyLogs].sort((a, b) => (a.date > b.date ? 1 : -1));
    const chartPoints = sorted.slice(-8).map((l) => ({ label: l.date.slice(5), value: l.weight }));
    const musclePoints = sorted
        .filter((l) => l.skeletalMuscle != null)
        .slice(-8)
        .map((l) => ({ label: l.date.slice(5), value: l.skeletalMuscle }));
    const fatPctPoints = sorted
        .filter((l) => l.bodyFatPercent != null)
        .slice(-8)
        .map((l) => ({ label: l.date.slice(5), value: l.bodyFatPercent }));
    const historyDesc = [...sorted].reverse();
    async function handleSubmit(e) {
        e.preventDefault();
        if (!weight)
            return;
        await addInbodyLog({
            profileId,
            date,
            weight: Number(weight),
            skeletalMuscle: muscle === "" ? null : Number(muscle),
            bodyFatPercent: fatPct === "" ? null : Number(fatPct),
            bodyFatMass: fatMass === "" ? null : Number(fatMass),
            bmi: bmi === "" ? null : Number(bmi),
            score: score === "" ? null : Number(score),
        });
        setWeight("");
        setMuscle("");
        setFatPct("");
        setFatMass("");
        setBmi("");
        setScore("");
        setShowForm(false);
    }
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const weightDiff = latest && prev ? Math.round((latest.weight - prev.weight) * 10) / 10 : null;
    const muscleDiff = latest && prev && latest.skeletalMuscle != null && prev.skeletalMuscle != null
        ? Math.round((latest.skeletalMuscle - prev.skeletalMuscle) * 10) / 10
        : null;
    const fatPctDiff = latest && prev && latest.bodyFatPercent != null && prev.bodyFatPercent != null
        ? Math.round((latest.bodyFatPercent - prev.bodyFatPercent) * 10) / 10
        : null;
    const cutoff = daysAgoStr(6);
    const recentFood = foodLogs.filter((l) => l.date >= cutoff);
    const foodByDate = {};
    recentFood.forEach((l) => { foodByDate[l.date] = (foodByDate[l.date] || 0) + (l.kcal || 0); });
    const foodDayKeys = Object.keys(foodByDate);
    const avgKcal = foodDayKeys.length > 0
        ? Math.round(foodDayKeys.reduce((s, d) => s + foodByDate[d], 0) / foodDayKeys.length)
        : null;
    const recentVolume = logs
        .filter((l) => l.type === "strength" && l.date >= cutoff)
        .reduce((s, l) => s + (l.volume || 0), 0);
    const recentCardioMin = logs
        .filter((l) => l.type === "cardio" && l.date >= cutoff)
        .reduce((s, l) => s + (l.durationMin || 0), 0);
    const weekDatesArr = useMemo(() => weekDates(0), []);
    const avgMacro = avgMacroPercents(foodLogs, weekDatesArr);
    const targetPct = macroTargetPercents(goal);
    let macroGap = null;
    if (avgMacro) {
        const macroDiffs = [
            { label: "탄수화물", diff: avgMacro.carb - targetPct.carb },
            { label: "단백질", diff: avgMacro.protein - targetPct.protein },
            { label: "지방", diff: avgMacro.fat - targetPct.fat },
        ].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
        if (Math.abs(macroDiffs[0].diff) >= 5)
            macroGap = macroDiffs[0];
    }
    const rec = buildRecommendation(goal, weightDiff, avgKcal, recentVolume, recentCardioMin, muscleDiff, fatPctDiff, macroGap);
    const recentCardio = [...logs]
        .filter((l) => l.type === "cardio")
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5);
    // Gemini 호출 공통 함수 (AI 조언 / 주간 체크 둘 다 여기로 요청을 보내요)
    function callGemini(prompt) {
        return fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(geminiKey.trim())}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        })
            .then(async (res) => {
            if (!res.ok) {
                let detail = "";
                try {
                    const errJson = await res.json();
                    detail = errJson && errJson.error && errJson.error.message ? errJson.error.message : "";
                }
                catch (e) {
                    /* 응답이 JSON이 아닐 수도 있음 */
                }
                throw new Error(`HTTP ${res.status}${detail ? " - " + detail : ""}`);
            }
            return res.json();
        })
            .then((data) => {
            const text = data &&
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts[0] &&
                data.candidates[0].content.parts[0].text;
            if (!text)
                throw new Error("빈 응답 (안전 필터에 걸렸거나 응답 형식이 예상과 달라요)");
            return text.trim();
        });
    }
    // 키가 없을 때: 마스터에게는 직접 넣으라고, 마스터가 아니면 마스터에게 요청하라고 안내
    function missingKeyMessage() {
        return isMaster
            ? "먼저 아래 '설정 더보기'에서 Gemini API 키를 입력해주세요."
            : "아직 마스터가 Gemini API 키를 설정하지 않았어요. 마스터에게 요청해주세요.";
    }
    const inbodyLine = latest
        ? `체중 ${latest.weight}kg` +
            (latest.skeletalMuscle != null ? `, 골격근량 ${latest.skeletalMuscle}kg` : "") +
            (latest.bodyFatPercent != null ? `, 체지방률 ${latest.bodyFatPercent}%` : "")
        : "기록 없음";
    const macroLine = avgMacro
        ? `탄 ${avgMacro.carb}% · 단 ${avgMacro.protein}% · 지 ${avgMacro.fat}%`
        : "기록 없음";
    function fetchAiTip() {
        if (!geminiKey.trim()) {
            setAiError(missingKeyMessage());
            return;
        }
        setAiLoading(true);
        setAiError(null);
        const userQuestion = question.trim() || "지금까지의 데이터를 종합해서 조언해주세요.";
        const prompt = "당신은 웨이트 트레이닝/다이어트 코치입니다. 운동, 식단, 체성분(인바디)과 관련 없는 질문에는 답변하지 말고 정중히 거절하세요. " +
            "'적게 먹고 많이 움직이세요' 같은 뻔한 말 말고, 아래 데이터를 근거로 사용자의 질문에 구체적이고 실용적으로, " +
            "한국어로 3문단 이내로 답변해주세요.\n\n" +
            `사용자 질문: ${userQuestion}\n\n` +
            `목표: ${goal || "미설정"}\n` +
            `최근 인바디 측정값 (최신): ${inbodyLine}\n` +
            `직전 측정 대비 체중 변화: ${weightDiff != null ? weightDiff + "kg" : "비교 불가"}\n` +
            `직전 측정 대비 골격근량 변화: ${muscleDiff != null ? muscleDiff + "kg" : "비교 불가"}\n` +
            `직전 측정 대비 체지방률 변화: ${fatPctDiff != null ? fatPctDiff + "%p" : "비교 불가"}\n` +
            `최근 7일 평균 섭취 칼로리: ${avgKcal != null ? avgKcal + "kcal" : "기록 없음"}\n` +
            `최근 7일 근력 운동 볼륨 합계: ${recentVolume}kg\n` +
            `최근 7일 유산소 시간 합계: ${recentCardioMin}분\n` +
            `목표(${goal || "유지"}) 권장 탄단지 비율: 탄 ${targetPct.carb}% · 단 ${targetPct.protein}% · 지 ${targetPct.fat}%\n` +
            `최근 7일 실제 평균 탄단지 비율: ${macroLine}`;
        callGemini(prompt)
            .then((text) => setAiTip(text))
            .catch((err) => {
            const msg = err && err.message ? err.message : "알 수 없는 오류";
            setAiError(`AI 답변 요청이 실패했어요. (${msg})`);
        })
            .finally(() => setAiLoading(false));
    }
    // "체크" 버튼: 최근 7일 운동/식단 + 최신 인바디를 묶어서 이번 주가 어땠는지 5문단 이내 피드백
    function fetchWeeklyCheck() {
        if (!geminiKey.trim()) {
            setWeeklyError(missingKeyMessage());
            return;
        }
        setWeeklyLoading(true);
        setWeeklyError(null);
        const prompt = "당신은 웨이트 트레이닝/다이어트 코치입니다. 아래는 사용자의 최근 7일 운동·식단 데이터와 가장 최신 인바디 기록입니다. " +
            "이 데이터를 종합해서 '이번 한 주 체크' 피드백을 한국어로 5문단 이내로 작성해주세요. 운동, 식단, 체성분과 " +
            "관련 없는 이야기는 하지 마세요.\n" +
            "다음 내용을 자연스러운 글로 포함해주세요: " +
            "(1) 이번 주 전체 요약, " +
            "(2) 잘한 점 — 예를 들어 근력 운동 볼륨이 올랐다면 점진적 과부하가 잘 되고 있다고, 칼로리를 목표에 맞게 잘 지켰다면 그 점을 짚어주세요, " +
            "(3) 아쉬운 점 — 예를 들어 칼로리는 맞았는데 탄단지 비율이 목표와 어긋났다면 그 부분을 짚어주세요, " +
            "(4) 최신 인바디 수치(체중·체지방률·골격근량)를 지금 섭취/운동 패턴과 같이 놓고, 지금 몸 상태에 비해 영양 섭취가 적절한지 코멘트, " +
            "(5) 다음 주에 조정하면 좋을 점 한 가지 제안.\n\n" +
            `목표: ${goal || "미설정"}\n` +
            `최근 7일 근력 운동 볼륨 합계: ${recentVolume}kg\n` +
            `최근 7일 유산소 시간 합계: ${recentCardioMin}분\n` +
            `최근 7일 평균 섭취 칼로리: ${avgKcal != null ? avgKcal + "kcal" : "기록 없음"}\n` +
            `목표(${goal || "유지"}) 권장 탄단지 비율: 탄 ${targetPct.carb}% · 단 ${targetPct.protein}% · 지 ${targetPct.fat}%\n` +
            `최근 7일 실제 평균 탄단지 비율: ${macroLine}\n` +
            `최신 인바디 측정값: ${inbodyLine}\n` +
            `직전 측정 대비 체중 변화: ${weightDiff != null ? weightDiff + "kg" : "비교 불가"}\n` +
            `직전 측정 대비 골격근량 변화: ${muscleDiff != null ? muscleDiff + "kg" : "비교 불가"}\n` +
            `직전 측정 대비 체지방률 변화: ${fatPctDiff != null ? fatPctDiff + "%p" : "비교 불가"}`;
        callGemini(prompt)
            .then((text) => setWeeklyReport(text))
            .catch((err) => {
            const msg = err && err.message ? err.message : "알 수 없는 오류";
            setWeeklyError(`체크 요청이 실패했어요. (${msg})`);
        })
            .finally(() => setWeeklyLoading(false));
    }
    return React.createElement("div", { className: "inbody-tab" }, React.createElement("h2", null, "목표"), React.createElement("div", { className: "goal-row" }, ["다이어트", "유지", "벌크업"].map((g) => React.createElement("button", {
        type: "button",
        key: g,
        className: "chip-btn" + (goal === g ? " active" : ""),
        style: { flex: 1 },
        onClick: () => setProfileGoal(profileId, g),
    }, g))), React.createElement("h2", null, "체중 추이"), React.createElement(LineChart, { points: chartPoints, valueSuffix: "kg" }), React.createElement("h2", null, "골격근량 추이"), React.createElement(LineChart, { points: musclePoints, valueSuffix: "kg", colorVar: "var(--accent-2)" }), React.createElement("h2", null, "체지방률 추이"), React.createElement(LineChart, { points: fatPctPoints, valueSuffix: "%", colorVar: "var(--danger)" }), React.createElement("h2", null, "비교 요약 (최근 7일)"), React.createElement("div", { className: "stat-row" }, React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "체중 변화"), React.createElement("span", { className: "stat-value" }, weightDiff == null ? "-" : (weightDiff > 0 ? "+" : "") + weightDiff, React.createElement("em", null, " kg"))), React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "일 평균 섭취"), React.createElement("span", { className: "stat-value" }, avgKcal == null ? "-" : avgKcal, React.createElement("em", null, " kcal")))), React.createElement("div", { className: "stat-row" }, React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "근력 볼륨 합"), React.createElement("span", { className: "stat-value" }, recentVolume.toLocaleString(), React.createElement("em", null, " kg"))), React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "유산소 시간 합"), React.createElement("span", { className: "stat-value" }, recentCardioMin, React.createElement("em", null, " 분")))), React.createElement("div", { className: "stat-row" }, React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "골격근량 변화"), React.createElement("span", { className: "stat-value" }, muscleDiff == null ? "-" : (muscleDiff > 0 ? "+" : "") + muscleDiff, React.createElement("em", null, " kg"))), React.createElement("div", { className: "stat-tile" }, React.createElement("span", { className: "stat-label" }, "체지방률 변화"), React.createElement("span", { className: "stat-value" }, fatPctDiff == null ? "-" : (fatPctDiff > 0 ? "+" : "") + fatPctDiff, React.createElement("em", null, " %p")))), React.createElement("p", { className: "macro-target" }, "최근 7일 탄단지: ", avgMacro
        ? React.createElement(React.Fragment, null, React.createElement("strong", null, `탄 ${avgMacro.carb}% · 단 ${avgMacro.protein}% · 지 ${avgMacro.fat}%`), ` (목표 ${targetPct.carb}/${targetPct.protein}/${targetPct.fat}%)`)
        : "식단 탭에서 탄단지 정보가 있는 음식을 기록하면 표시돼요.", macroGap &&
        React.createElement("span", { style: { color: "var(--danger)" } }, ` → ${macroGap.label} ${Math.abs(macroGap.diff)}%p ${macroGap.diff > 0 ? "초과, 줄이면서" : "부족, 늘리면서"} 밸런스를 맞춰보세요.`)), React.createElement("div", { className: "rec-card" }, React.createElement("h3", null, "📋 이번 주 체크"), !weeklyReport &&
        React.createElement("p", { className: "muted", style: { margin: "0 0 10px", fontSize: "13px", lineHeight: 1.5 } }, "운동 볼륨·섭취 칼로리·탄단지 비율과 최신 인바디 수치를 한 번에 묶어서, 이번 한 주가 어땠는지 AI가 종합 피드백을 줘요."), weeklyReport &&
        React.createElement("p", { className: "muted", style: { margin: "0 0 10px", fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" } }, weeklyReport), !weeklyReport &&
        React.createElement("button", { type: "button", className: "btn-secondary", disabled: weeklyLoading, onClick: fetchWeeklyCheck }, weeklyLoading ? "체크하는 중..." : "✅ 체크"), weeklyReport &&
        React.createElement("button", {
            type: "button",
            className: "btn-secondary",
            onClick: () => { setWeeklyReport(null); setWeeklyError(null); },
        }, "다시 체크"), weeklyError && React.createElement("p", { style: { color: "var(--danger)", fontSize: "12px", marginTop: 8, marginBottom: 0 } }, weeklyError)), React.createElement("div", { className: "rec-card" }, React.createElement("h3", null, aiTip ? "✨ AI 답변" : `💡 ${rec.title}`), React.createElement("p", { className: "muted", style: { margin: "0 0 10px", fontSize: "13px", lineHeight: 1.5, whiteSpace: "pre-wrap" } }, aiTip || rec.text), !aiTip &&
        React.createElement(React.Fragment, null, React.createElement("textarea", {
            placeholder: "AI에게 궁금한 점을 물어보세요 (비워두면 종합 조언을 줘요)",
            value: question,
            onChange: (e) => setQuestion(e.target.value),
            rows: 2,
            style: { marginBottom: 8, width: "100%", resize: "vertical", fontFamily: "inherit" },
        }), React.createElement("button", { type: "button", className: "btn-secondary", disabled: aiLoading, onClick: fetchAiTip }, aiLoading ? "AI 답변 요청 중..." : "✨ AI에게 물어보기 (Gemini)")), aiTip &&
        React.createElement("button", {
            type: "button",
            className: "btn-secondary",
            style: { marginTop: 4 },
            onClick: () => { setAiTip(null); setAiError(null); setQuestion(""); },
        }, "기본 팁으로 되돌리기"), aiError && React.createElement("p", { style: { color: "var(--danger)", fontSize: "12px", marginTop: 8, marginBottom: 0 } }, aiError), isMaster &&
        React.createElement("div", { style: { marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" } }, React.createElement("button", {
            type: "button",
            className: "btn-secondary",
            style: { fontSize: 12, padding: "4px 10px" },
            onClick: () => { setShowSettings((v) => !v); setEditingKey(false); },
        }, showSettings ? "⚙️ 설정 닫기" : "⚙️ 설정 더보기"), showSettings &&
            React.createElement("div", { style: { marginTop: 8 } }, !editingKey &&
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, React.createElement("span", { className: "muted", style: { fontSize: 12 } }, hasSavedKey ? "Gemini API 키: 설정됨" : "Gemini API 키: 설정 안 됨"), React.createElement("button", { type: "button", className: "btn-secondary", style: { fontSize: 12, padding: "4px 10px" }, onClick: openKeyEditor }, "API 키 수정")), editingKey &&
                React.createElement(React.Fragment, null, React.createElement("input", {
                    type: "password",
                    placeholder: "Gemini API 키 입력",
                    value: keyDraft,
                    onChange: (e) => setKeyDraft(e.target.value),
                    style: { marginBottom: 8, width: "100%" },
                }), React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, React.createElement("button", { type: "button", className: "btn-primary", style: { fontSize: 12, padding: "4px 10px" }, onClick: saveKeyDraft }, "저장"), React.createElement("button", { type: "button", className: "btn-secondary", style: { fontSize: 12, padding: "4px 10px" }, onClick: () => setEditingKey(false) }, "취소"), hasSavedKey &&
                    React.createElement("button", { type: "button", className: "btn-secondary", style: { fontSize: 12, padding: "4px 10px" }, onClick: clearKey }, "키 해제")))))), React.createElement("h2", null, "⌚ 워치 연동 유산소 기록"), React.createElement("div", { className: "note-box" }, "워치(애플워치/갤럭시워치) 자동 연동은 아직 지원되지 않아요. 나중에 앱으로 만들면 그때 연동할 예정이고, 지금은 '운동' 탭에서 직접 입력한 유산소 기록만 아래에 표시됩니다."), React.createElement("div", { className: "history-list" }, recentCardio.length === 0 && React.createElement("p", { className: "muted" }, "아직 유산소 기록이 없어요."), recentCardio.map((l) => React.createElement("div", { className: "history-row", key: l.id }, React.createElement("div", null, React.createElement("span", { className: "history-date" }, l.date), React.createElement("strong", { className: "history-exname" }, ` ${l.exerciseName}`), React.createElement("div", { className: "history-detail" }, `${l.durationMin}분${l.distanceKm ? ` · ${l.distanceKm}km` : ""}`))))), React.createElement("h2", null, "인바디 기록"), !showForm &&
        React.createElement("button", { type: "button", className: "add-exercise-btn", onClick: () => setShowForm(true) }, "+ 인바디 측정값 입력"), showForm &&
        React.createElement("form", { className: "log-entry-form", onSubmit: handleSubmit }, React.createElement("label", null, "날짜"), React.createElement("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value) }), React.createElement("label", null, "체중 (kg)"), React.createElement("input", {
            type: "number",
            step: "0.1",
            value: weight,
            onChange: (e) => setWeight(e.target.value),
            placeholder: "예: 70.5",
            autoFocus: true,
        }), React.createElement("label", null, "골격근량 (kg, 선택)"), React.createElement("input", { type: "number", step: "0.1", value: muscle, onChange: (e) => setMuscle(e.target.value) }), React.createElement("label", null, "체지방률 (%, 선택)"), React.createElement("input", { type: "number", step: "0.1", value: fatPct, onChange: (e) => setFatPct(e.target.value) }), React.createElement("label", null, "체지방량 (kg, 선택)"), React.createElement("input", { type: "number", step: "0.1", value: fatMass, onChange: (e) => setFatMass(e.target.value) }), React.createElement("label", null, "BMI (선택)"), React.createElement("input", { type: "number", step: "0.1", value: bmi, onChange: (e) => setBmi(e.target.value) }), React.createElement("label", null, "인바디 점수 (선택)"), React.createElement("input", { type: "number", value: score, onChange: (e) => setScore(e.target.value) }), React.createElement("div", { className: "modal-actions" }, React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setShowForm(false) }, "취소"), React.createElement("button", { type: "submit", className: "btn-primary" }, "저장"))), React.createElement("div", { className: "history-list", style: { marginTop: 10 } }, historyDesc.length === 0 && React.createElement("p", { className: "muted" }, "아직 인바디 기록이 없어요."), historyDesc.map((l) => React.createElement("div", { className: "history-row", key: l.id }, React.createElement("div", null, React.createElement("span", { className: "history-date" }, l.date), React.createElement("div", { className: "history-detail" }, `${l.weight}kg` +
        (l.bodyFatPercent != null ? ` · 체지방 ${l.bodyFatPercent}%` : "") +
        (l.skeletalMuscle != null ? ` · 골격근 ${l.skeletalMuscle}kg` : ""))), React.createElement("button", { className: "history-delete", onClick: () => deleteInbodyLog(l.id) }, "삭제")))));
}
