import React, { useState } from "https://esm.sh/react@18.3.1";
import { searchLocalFoodDb } from "../food-db.js";
import { sumRecipeTotals } from "../utils.js";

// "🍳 만들어 먹음" — 간장계란밥처럼 여러 재료를 합쳐 만든 음식을 기록할 때 씁니다.
// 계란은 개수로, 간장/참기름은 큰술/작은술로, 밥은 그램으로... 재료마다 편한 단위로
// 넣으면 100g당 영양값 + 이번에 만든 총량으로 환산해서 하나의 음식으로 저장해요.
// initialRecipe가 있으면(기존 레시피의 "✏️ 레시피 수정") 그 재료 구성을 그대로 불러와서
// 수량만 바꿔 다시 저장할 수 있어요 (예: 오늘은 계란 5개, 내일은 3개).
export function RecipeModal({ allFoods, initialRecipe, onClose, onSave }) {
  const [dishName, setDishName] = useState(initialRecipe ? initialRecipe.name : "");
  const [rows, setRows] = useState(() =>
    initialRecipe && initialRecipe.ingredients && initialRecipe.ingredients.length > 0
      ? initialRecipe.ingredients.map((ing, i) => ({
          key: `init_${i}`,
          food: {
            name: ing.name,
            kcalPer100g: ing.kcalPer100g,
            protein: ing.protein,
            fat: ing.fat,
            carb: ing.carb,
            saturatedFat: ing.saturatedFat,
            unitGrams: ing.unitGrams,
            unitLabel: ing.unitLabel,
          },
          qty: String(ing.qty),
          unit: ing.unit,
          query: "",
          searchResults: [],
        }))
      : [emptyRow(0)]
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  let _rowKey = rows.length;
  function emptyRow(seed) {
    return { key: `row_${seed}`, food: null, qty: "1", unit: "g", query: "", searchResults: [] };
  }

  function updateRow(key, patch) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(_rowKey++)]);
  }

  function removeRow(key) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function pickFood(key, food) {
    // 개수 단위를 쓸 수 있으면(예: 계란 1개≈45g) 기본값을 "개"로, 아니면 "g"로 시작해요.
    updateRow(key, { food, unit: food.unitGrams ? "count" : "g", qty: "1", query: "", searchResults: [] });
  }

  function onRowQueryChange(key, value) {
    updateRow(key, { query: value });
    const q = value.trim();
    if (!q) {
      updateRow(key, { searchResults: [] });
      return;
    }
    const local = allFoods.filter((f) => f.name.includes(q)).slice(0, 6);
    updateRow(key, { searchResults: local });
  }

  function searchMore(key, query) {
    const q = query.trim();
    if (!q) return;
    searchLocalFoodDb(q, 10).then((results) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.key !== key) return r;
          const existingNames = new Set(r.searchResults.map((f) => f.name));
          const merged = [...r.searchResults, ...results.filter((f) => !existingNames.has(f.name))];
          return { ...r, searchResults: merged };
        })
      );
    });
  }

  const totals = sumRecipeTotals(rows);
  const filledRows = rows.filter((r) => r.food);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dishName.trim() || totals.totalGrams <= 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const ingredients = filledRows.map((r) => ({
        name: r.food.name,
        qty: Number(r.qty) || 0,
        unit: r.unit,
        kcalPer100g: r.food.kcalPer100g,
        protein: r.food.protein,
        fat: r.food.fat,
        carb: r.food.carb,
        saturatedFat: r.food.saturatedFat,
        unitGrams: r.food.unitGrams || null,
        unitLabel: r.food.unitLabel || null,
      }));
      const per100 = 100 / totals.totalGrams;
      const round1 = (n) => (n == null ? null : Math.round(n * per100 * 10) / 10);
      await onSave({
        id: initialRecipe ? initialRecipe.id : null,
        name: dishName.trim(),
        kcalPer100g: Math.round(totals.kcal * per100),
        category: "내 레시피",
        protein: round1(totals.protein),
        fat: round1(totals.fat),
        carb: round1(totals.carb),
        saturatedFat: round1(totals.saturatedFat),
        unitLabel: "회분",
        unitGrams: totals.totalGrams,
        isRecipe: true,
        ingredients,
        // 오늘 기록에도 바로 반영할 수 있도록 이번에 만든 실제 총량도 같이 넘겨요.
        totalGrams: totals.totalGrams,
        totalKcal: totals.kcal,
        totalProtein: totals.protein,
        totalFat: totals.fat,
        totalCarb: totals.carb,
        totalSatFat: totals.saturatedFat,
      });
    } catch (err) {
      setSaveError(`저장에 실패했어요. (${err && err.message ? err.message : "알 수 없는 오류"})`);
    } finally {
      setSaving(false);
    }
  }

  return React.createElement(
    "div",
    { className: "modal-backdrop", onClick: onClose },
    React.createElement(
      "form",
      { className: "modal", onClick: (e) => e.stopPropagation(), onSubmit: handleSubmit },
      React.createElement("h2", null, initialRecipe ? "레시피 수정" : "만들어 먹음"),
      React.createElement("label", null, "요리 이름"),
      React.createElement("input", {
        type: "text",
        value: dishName,
        onChange: (e) => setDishName(e.target.value),
        placeholder: "예: 간장계란밥",
        autoFocus: true,
      }),

      React.createElement("label", null, "재료"),
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 10 } },
        rows.map((r) =>
          React.createElement(
            "div",
            { key: r.key, className: "note-box", style: { borderStyle: "solid" } },
            !r.food &&
              React.createElement(
                React.Fragment,
                null,
                React.createElement("input", {
                  type: "text",
                  placeholder: "재료 검색 (예: 계란, 간장)",
                  value: r.query,
                  onChange: (e) => onRowQueryChange(r.key, e.target.value),
                  style: { marginBottom: 6 },
                }),
                r.query.trim() &&
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "btn-secondary",
                      style: { fontSize: 12, padding: "6px 10px", marginBottom: 6 },
                      onClick: () => searchMore(r.key, r.query),
                    },
                    "더 찾기 (공공데이터)"
                  ),
                React.createElement(
                  "div",
                  { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
                  r.searchResults.map((f, i) =>
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        key: i,
                        className: "chip-btn",
                        style: { padding: "6px 10px", fontSize: 12.5 },
                        onClick: () => pickFood(r.key, f),
                      },
                      f.name
                    )
                  ),
                  r.query.trim() && r.searchResults.length === 0 &&
                    React.createElement("span", { className: "muted", style: { fontSize: 12.5 } }, "검색 결과가 없어요.")
                )
              ),
            r.food &&
              React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  "div",
                  { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
                  React.createElement("strong", { style: { fontSize: 13.5 } }, r.food.name),
                  React.createElement(
                    "button",
                    { type: "button", className: "history-delete", onClick: () => updateRow(r.key, { food: null }) },
                    "재료 변경"
                  )
                ),
                React.createElement(
                  "div",
                  { style: { display: "flex", gap: 8 } },
                  React.createElement("input", {
                    type: "number",
                    step: "0.1",
                    min: 0,
                    value: r.qty,
                    onChange: (e) => updateRow(r.key, { qty: e.target.value }),
                    style: { flex: 1 },
                  }),
                  React.createElement(
                    "select",
                    {
                      value: r.unit,
                      onChange: (e) => updateRow(r.key, { unit: e.target.value }),
                      style: { flex: 1 },
                    },
                    r.food.unitGrams &&
                      React.createElement("option", { value: "count" }, `${r.food.unitLabel || "개"} (1${r.food.unitLabel || "개"}≈${r.food.unitGrams}g)`),
                    React.createElement("option", { value: "g" }, "g"),
                    React.createElement("option", { value: "tbsp" }, "큰술 (≈15g)"),
                    React.createElement("option", { value: "tsp" }, "작은술 (≈5g)"),
                    React.createElement("option", { value: "cup" }, "컵 (≈200g)")
                  )
                )
              )
          )
        ),
        React.createElement(
          "button",
          { type: "button", className: "add-set-btn", onClick: addRow, style: { margin: 0 } },
          "+ 재료 추가"
        )
      ),

      React.createElement(
        "div",
        { className: "kcal-summary", style: { marginTop: 14 } },
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "muted", style: { fontSize: 12 } }, `총 ${totals.totalGrams}g`),
          React.createElement("strong", null, `${totals.kcal} kcal`)
        ),
        React.createElement(
          "div",
          { className: "muted", style: { fontSize: 12.5, textAlign: "right" } },
          `탄 ${totals.carb != null ? totals.carb : "-"}g`,
          React.createElement("br"),
          `단 ${totals.protein != null ? totals.protein : "-"}g · 지 ${totals.fat != null ? totals.fat : "-"}g`
        )
      ),

      React.createElement(
        "div",
        { className: "modal-actions" },
        React.createElement("button", { type: "button", className: "btn-secondary", onClick: onClose }, "취소"),
        React.createElement(
          "button",
          { type: "submit", className: "btn-primary", disabled: saving || !dishName.trim() || totals.totalGrams <= 0 },
          saving ? "저장 중..." : "오늘 기록에 추가"
        )
      ),
      saveError && React.createElement("p", { style: { color: "var(--danger)", fontSize: "12px", marginTop: 8 } }, saveError)
    )
  );
}
