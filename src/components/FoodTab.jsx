import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import {
  addCustomFood,
  addFoodLog,
  deleteFoodLog,
  subscribeCustomFoods,
  subscribeFoodLogsForProfile,
} from "../store.js";
import { LineChart } from "./Chart.jsx";
import {
  todayStr,
  weekDates,
  macroPercentsForDate,
  macroTargetPercents,
  macroRatioLabel,
  TARGET_MACRO_RATIO,
} from "../utils.js";

export function FoodTab({ foods, profileId, goal }) {
  const [customFoods, setCustomFoods] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState("100");
  const [showAdd, setShowAdd] = useState(false);
  const [date] = useState(todayStr());

  useEffect(() => {
    return subscribeCustomFoods(setCustomFoods);
  }, []);
  useEffect(() => {
    return subscribeFoodLogsForProfile(profileId, setFoodLogs);
  }, [profileId]);

  const allFoods = useMemo(() => [...foods, ...customFoods], [foods, customFoods]);
  const filtered = useMemo(
    () => (search.trim() ? allFoods.filter((f) => f.name.includes(search.trim())) : allFoods),
    [allFoods, search]
  );

  function openFood(f) {
    setSelectedFood(f);
    setGrams(f.unitGrams ? String(f.unitGrams) : "100");
  }

  const todayLogs = foodLogs.filter((l) => l.date === date);
  const todayKcal = todayLogs.reduce((sum, l) => sum + (l.kcal || 0), 0);
  const todayCarb = todayLogs.reduce((s, l) => s + (l.carbG || 0), 0);
  const todayProtein = todayLogs.reduce((s, l) => s + (l.proteinG || 0), 0);
  const todayFat = todayLogs.reduce((s, l) => s + (l.fatG || 0), 0);
  const todayMacroAny = todayLogs.some((l) => l.carbG != null || l.proteinG != null || l.fatG != null);
  const todaySatFat = todayLogs.reduce((s, l) => s + (l.satFatG || 0), 0);
  const todaySatFatAny = todayLogs.some((l) => l.satFatG != null);

  async function handleLog(e) {
    e.preventDefault();
    if (!selectedFood) return;
    const g = Number(grams) || 0;
    const kcal = Math.round((selectedFood.kcalPer100g * g) / 100);
    const proteinG = selectedFood.protein != null ? Math.round(((selectedFood.protein * g) / 100) * 10) / 10 : null;
    const fatG = selectedFood.fat != null ? Math.round(((selectedFood.fat * g) / 100) * 10) / 10 : null;
    const carbG = selectedFood.carb != null ? Math.round(((selectedFood.carb * g) / 100) * 10) / 10 : null;
    const satFatG =
      selectedFood.saturatedFat != null ? Math.round(((selectedFood.saturatedFat * g) / 100) * 10) / 10 : null;
    await addFoodLog({
      profileId,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      kcalPer100g: selectedFood.kcalPer100g,
      grams: g,
      kcal,
      date,
      proteinG,
      fatG,
      carbG,
      satFatG,
    });
    setSelectedFood(null);
    setGrams("100");
  }

  const weekDatesArr = useMemo(() => weekDates(0), []);
  const macroDaily = weekDatesArr
    .map((d) => ({ date: d, m: macroPercentsForDate(foodLogs, d) }))
    .filter((x) => x.m != null);
  const carbPoints = macroDaily.map((x) => ({ label: x.date.slice(5), value: x.m.carb }));
  const proteinPoints = macroDaily.map((x) => ({ label: x.date.slice(5), value: x.m.protein }));
  const fatPoints = macroDaily.map((x) => ({ label: x.date.slice(5), value: x.m.fat }));
  const targetPct = macroTargetPercents(goal);

  return React.createElement(
    "div",
    { className: "food-tab" },
    React.createElement(
      "div",
      { className: "kcal-summary" },
      React.createElement("span", null, "오늘 섭취 칼로리"),
      React.createElement("strong", null, `${todayKcal.toLocaleString()} kcal`)
    ),
    todayMacroAny &&
      React.createElement(
        "p",
        { className: "muted", style: { marginTop: -6, marginBottom: 4, fontSize: "12.5px" } },
        "탄 ",
        React.createElement("strong", null, `${Math.round(todayCarb * 10) / 10}g`),
        " · 단 ",
        React.createElement("strong", null, `${Math.round(todayProtein * 10) / 10}g`),
        " · 지 ",
        React.createElement("strong", null, `${Math.round(todayFat * 10) / 10}g`)
      ),
    todaySatFatAny &&
      React.createElement(
        "p",
        { className: "muted", style: { marginTop: -6, marginBottom: 10, fontSize: "12.5px" } },
        "오늘 포화지방 ",
        React.createElement("strong", { style: { color: "var(--danger)" } }, `${Math.round(todaySatFat * 10) / 10}g`),
        " (지방 중 나쁜 지방 — 참고용 추정치예요)"
      ),

    React.createElement("h2", null, "탄단지 비율 추이 (최근 7일)"),
    React.createElement(
      "p",
      { className: "macro-target" },
      `목표(${goal || "유지"}) 권장 비율 `,
      React.createElement("strong", null, macroRatioLabel(TARGET_MACRO_RATIO[goal] || TARGET_MACRO_RATIO["유지"])),
      ` → 탄 `,
      React.createElement("strong", null, `${targetPct.carb}%`),
      ` · 단 `,
      React.createElement("strong", null, `${targetPct.protein}%`),
      ` · 지 `,
      React.createElement("strong", null, `${targetPct.fat}%`)
    ),
    React.createElement(
      "div",
      { className: "macro-legend" },
      React.createElement("span", null, React.createElement("span", { className: "cal-dot" }), " 탄수화물%"),
      React.createElement("span", null, React.createElement("span", { className: "cal-dot food" }), " 단백질%"),
      React.createElement("span", null, React.createElement("span", { className: "cal-dot", style: { background: "var(--danger)" } }), " 지방%")
    ),
    React.createElement(LineChart, { points: carbPoints, valueSuffix: "%" }),
    React.createElement(LineChart, { points: proteinPoints, valueSuffix: "%", colorVar: "var(--accent-2)" }),
    React.createElement(LineChart, { points: fatPoints, valueSuffix: "%", colorVar: "var(--danger)" }),
    React.createElement(
      "p",
      { className: "muted", style: { fontSize: "11.5px", marginTop: -4 } },
      "※ 탄수화물/단백질/지방을 입력한 음식 기록이 있는 날만 표시돼요."
    ),

    React.createElement("h2", null, "음식 검색"),
    React.createElement("input", {
      type: "text",
      className: "search-input",
      placeholder: "음식 검색...",
      value: search,
      onChange: (e) => setSearch(e.target.value),
    }),

    React.createElement(
      "div",
      { className: "exercise-list" },
      filtered.map((f) =>
        React.createElement(
          "button",
          { key: f.id, className: "exercise-name-btn food-btn", onClick: () => openFood(f) },
          React.createElement("span", null, f.name),
          React.createElement(
            "span",
            { className: "exercise-meta" },
            `${f.kcalPer100g} kcal / 100g`,
            f.unitGrams != null && React.createElement("span", { style: { marginLeft: 6 } }, `(1${f.unitLabel} ≈ ${f.unitGrams}g)`),
            (f.carb != null || f.protein != null || f.fat != null) &&
              React.createElement(
                "span",
                { style: { marginLeft: 6 } },
                `(탄${f.carb != null ? f.carb : "-"} · 단${f.protein != null ? f.protein : "-"} · 지${f.fat != null ? f.fat : "-"})`
              ),
            f.saturatedFat != null &&
              React.createElement("span", { style: { color: "var(--danger)", marginLeft: 6, fontSize: "11px" } }, `포화지방 ${f.saturatedFat}g`)
          )
        )
      )
    ),

    React.createElement(
      "button",
      { className: "add-exercise-btn", onClick: () => setShowAdd(true) },
      "+ 음식 직접 추가"
    ),

    React.createElement("h3", null, "오늘 먹은 음식"),
    React.createElement(
      "div",
      { className: "history-list" },
      todayLogs.length === 0 && React.createElement("p", { className: "muted" }, "아직 기록이 없어요."),
      todayLogs.map((l) =>
        React.createElement(
          "div",
          { key: l.id, className: "history-row" },
          React.createElement("span", null, `${l.foodName} ${l.grams}g`),
          React.createElement(
            "span",
            { className: "history-detail" },
            `${l.kcal} kcal`,
            (l.carbG != null || l.proteinG != null || l.fatG != null) &&
              React.createElement(
                "span",
                { style: { marginLeft: 6, fontSize: "11px" } },
                `(탄${l.carbG != null ? l.carbG : "-"} · 단${l.proteinG != null ? l.proteinG : "-"} · 지${l.fatG != null ? l.fatG : "-"})`
              ),
            l.satFatG != null &&
              React.createElement("span", { style: { color: "var(--danger)", marginLeft: 6, fontSize: "11px" } }, `(포화지방 ${l.satFatG}g)`)
          ),
          React.createElement(
            "button",
            { className: "history-delete", onClick: () => deleteFoodLog(l.id) },
            "삭제"
          )
        )
      )
    ),

    selectedFood &&
      React.createElement(
        "div",
        { className: "modal-backdrop", onClick: () => setSelectedFood(null) },
        React.createElement(
          "form",
          { className: "modal", onClick: (e) => e.stopPropagation(), onSubmit: handleLog },
          React.createElement("h2", null, selectedFood.name),
          selectedFood.unitGrams != null
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement("label", null, `섭취량 (${selectedFood.unitLabel} 또는 g)`),
                React.createElement(
                  "div",
                  { style: { display: "flex", gap: 8, alignItems: "center" } },
                  React.createElement("input", {
                    type: "number",
                    step: "0.5",
                    value: Math.round(((Number(grams) || 0) / selectedFood.unitGrams) * 100) / 100,
                    onChange: (e) => setGrams(String(Math.round((Number(e.target.value) || 0) * selectedFood.unitGrams))),
                    autoFocus: true,
                    style: { flex: 1 },
                  }),
                  React.createElement("span", { className: "muted", style: { fontSize: "12.5px" } }, selectedFood.unitLabel),
                  React.createElement("input", {
                    type: "number",
                    value: grams,
                    onChange: (e) => setGrams(e.target.value),
                    style: { flex: 1 },
                  }),
                  React.createElement("span", { className: "muted", style: { fontSize: "12.5px" } }, "g")
                )
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement("label", null, "섭취량 (g)"),
                React.createElement("input", {
                  type: "number",
                  value: grams,
                  onChange: (e) => setGrams(e.target.value),
                  autoFocus: true,
                })
              ),
          React.createElement(
            "p",
            { className: "muted" },
            `= ${Math.round((selectedFood.kcalPer100g * (Number(grams) || 0)) / 100)} kcal`
          ),
          (selectedFood.carb != null || selectedFood.protein != null || selectedFood.fat != null) &&
            React.createElement(
              "p",
              { className: "muted", style: { marginTop: -6 } },
              "탄 ",
              React.createElement("strong", null, `${selectedFood.carb != null ? Math.round(((selectedFood.carb * (Number(grams) || 0)) / 100) * 10) / 10 : "-"}g`),
              " · 단 ",
              React.createElement("strong", null, `${selectedFood.protein != null ? Math.round(((selectedFood.protein * (Number(grams) || 0)) / 100) * 10) / 10 : "-"}g`),
              " · 지 ",
              React.createElement("strong", null, `${selectedFood.fat != null ? Math.round(((selectedFood.fat * (Number(grams) || 0)) / 100) * 10) / 10 : "-"}g`),
              selectedFood.saturatedFat != null &&
                React.createElement(
                  "span",
                  { style: { color: "var(--danger)" } },
                  ` (포화지방 약 ${Math.round(((selectedFood.saturatedFat * (Number(grams) || 0)) / 100) * 10) / 10}g)`
                )
            ),
          React.createElement(
            "div",
            { className: "modal-actions" },
            React.createElement(
              "button",
              { type: "button", className: "btn-secondary", onClick: () => setSelectedFood(null) },
              "취소"
            ),
            React.createElement("button", { type: "submit", className: "btn-primary" }, "기록")
          )
        )
      ),

    showAdd &&
      React.createElement(AddFoodModal, {
        onClose: () => setShowAdd(false),
        onSave: async (data) => {
          await addCustomFood(data);
          setShowAdd(false);
        },
      })
  );
}

function AddFoodModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [category, setCategory] = useState("기타");
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");
  const [sat, setSat] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [unitGrams, setUnitGrams] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !kcal) return;
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        kcalPer100g: Number(kcal),
        category,
        protein: p === "" ? null : Number(p),
        fat: f === "" ? null : Number(f),
        carb: c === "" ? null : Number(c),
        saturatedFat: sat === "" ? null : Number(sat),
        unitLabel: unitLabel.trim() && unitGrams ? unitLabel.trim() : null,
        unitGrams: unitLabel.trim() && unitGrams ? Number(unitGrams) : null,
      });
    } finally {
      setBusy(false);
    }
  }

  return React.createElement(
    "div",
    { className: "modal-backdrop", onClick: onClose },
    React.createElement(
      "form",
      { className: "modal", onClick: (e) => e.stopPropagation(), onSubmit: handleSubmit },
      React.createElement("h2", null, "음식 추가"),
      React.createElement("label", null, "음식 이름"),
      React.createElement("input", {
        type: "text",
        value: name,
        onChange: (e) => setName(e.target.value),
        autoFocus: true,
      }),
      React.createElement("label", null, "100g당 kcal"),
      React.createElement("input", {
        type: "number",
        value: kcal,
        onChange: (e) => setKcal(e.target.value),
      }),
      React.createElement("label", null, "분류 (선택)"),
      React.createElement("input", {
        type: "text",
        value: category,
        onChange: (e) => setCategory(e.target.value),
        placeholder: "예: 간식, 육류...",
      }),
      React.createElement("label", null, "100g당 탄수화물 (g, 선택 — 탄단지 비율 계산에 쓰여요)"),
      React.createElement("input", { type: "number", step: "0.1", value: c, onChange: (e) => setC(e.target.value) }),
      React.createElement("label", null, "100g당 단백질 (g, 선택)"),
      React.createElement("input", { type: "number", step: "0.1", value: p, onChange: (e) => setP(e.target.value) }),
      React.createElement("label", null, "100g당 지방 (g, 선택)"),
      React.createElement("input", { type: "number", step: "0.1", value: f, onChange: (e) => setF(e.target.value) }),
      React.createElement("label", null, "100g당 포화지방 (g, 선택 — 지방 중 나쁜 지방)"),
      React.createElement("input", { type: "number", step: "0.1", value: sat, onChange: (e) => setSat(e.target.value) }),
      React.createElement("label", null, "개수 단위 (선택 — 예: 달걀처럼 '개'로도 기록하고 싶을 때)"),
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8 } },
        React.createElement("input", {
          type: "text",
          placeholder: "단위 (예: 개, 장)",
          value: unitLabel,
          onChange: (e) => setUnitLabel(e.target.value),
          style: { flex: 1 },
        }),
        React.createElement("input", {
          type: "number",
          step: "0.1",
          placeholder: "1단위당 g",
          value: unitGrams,
          onChange: (e) => setUnitGrams(e.target.value),
          style: { flex: 1 },
        })
      ),
      React.createElement(
        "div",
        { className: "modal-actions" },
        React.createElement(
          "button",
          { type: "button", className: "btn-secondary", onClick: onClose },
          "취소"
        ),
        React.createElement(
          "button",
          { type: "submit", className: "btn-primary", disabled: busy },
          busy ? "저장 중..." : "저장"
        )
      )
    )
  );
}
