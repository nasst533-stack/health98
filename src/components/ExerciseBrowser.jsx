import React, { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { CATEGORIES } from "../exercises-data.js";
import { setFavorite, addCustomExercise } from "../store.js";
import { equipmentLabel } from "../utils.js";
import { LogForm } from "./LogForm.jsx";

export function ExerciseBrowser({ exercises, favorites, profileId }) {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (favOnly && !favorites.has(ex.id)) return false;
      if (category !== "전체" && ex.category !== category) return false;
      if (search.trim() && !ex.name.includes(search.trim())) return false;
      return true;
    });
  }, [exercises, favorites, category, search, favOnly]);

  if (selected) {
    return React.createElement(LogForm, {
      exercise: selected,
      profileId,
      onClose: () => setSelected(null),
    });
  }

  return React.createElement(
    "div",
    { className: "exercise-browser" },
    React.createElement(
      "div",
      { className: "search-row" },
      React.createElement("input", {
        type: "text",
        placeholder: "운동 검색...",
        value: search,
        onChange: (e) => setSearch(e.target.value),
        className: "search-input",
      }),
      React.createElement(
        "button",
        {
          className: "chip-btn" + (favOnly ? " active" : ""),
          onClick: () => setFavOnly((v) => !v),
          title: "즐겨찾기만 보기",
        },
        favOnly ? "★ 즐겨찾기" : "☆ 즐겨찾기"
      )
    ),
    React.createElement(
      "div",
      { className: "category-tabs" },
      CATEGORIES.map((c) =>
        React.createElement(
          "button",
          {
            key: c,
            className: "category-tab" + (category === c ? " active" : ""),
            onClick: () => setCategory(c),
          },
          c
        )
      )
    ),
    React.createElement(
      "div",
      { className: "exercise-list" },
      filtered.length === 0 &&
        React.createElement(
          "p",
          { className: "muted center" },
          "해당하는 운동이 없어요."
        ),
      filtered.map((ex) =>
        React.createElement(
          "div",
          { key: ex.id, className: "exercise-row" },
          React.createElement(
            "button",
            {
              className: "fav-star",
              onClick: (e) => {
                e.stopPropagation();
                setFavorite(profileId, ex.id, !favorites.has(ex.id));
              },
            },
            favorites.has(ex.id) ? "★" : "☆"
          ),
          React.createElement(
            "button",
            {
              className: "exercise-name-btn",
              onClick: () => setSelected(ex),
            },
            React.createElement("span", null, ex.name),
            React.createElement(
              "span",
              { className: "exercise-meta" },
              `${ex.category} · ${equipmentLabel(ex.equipment)}`
            )
          )
        )
      )
    ),
    React.createElement(
      "button",
      { className: "add-exercise-btn", onClick: () => setShowAdd(true) },
      "+ 운동 종목 직접 추가"
    ),
    showAdd &&
      React.createElement(AddExerciseModal, {
        onClose: () => setShowAdd(false),
        onSave: async (data) => {
          await addCustomExercise(data);
          setShowAdd(false);
        },
      })
  );
}

function AddExerciseModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("가슴");
  const [equipment, setEquipment] = useState("barbell");
  const [type, setType] = useState("strength");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({ name: name.trim(), category, equipment, type });
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
      React.createElement("h2", null, "운동 종목 추가"),
      React.createElement("label", null, "운동 이름"),
      React.createElement("input", {
        type: "text",
        value: name,
        onChange: (e) => setName(e.target.value),
        autoFocus: true,
      }),
      React.createElement("label", null, "부위"),
      React.createElement(
        "select",
        { value: category, onChange: (e) => setCategory(e.target.value) },
        CATEGORIES.filter((c) => c !== "전체").map(
          (c) => React.createElement("option", { key: c, value: c }, c)
        )
      ),
      React.createElement("label", null, "종류"),
      React.createElement(
        "select",
        { value: type, onChange: (e) => setType(e.target.value) },
        React.createElement("option", { value: "strength" }, "근력 (세트/횟수/무게)"),
        React.createElement("option", { value: "cardio" }, "유산소 (시간/거리)")
      ),
      type === "strength" &&
        React.createElement(
          React.Fragment,
          null,
          React.createElement("label", null, "장비"),
          React.createElement(
            "select",
            { value: equipment, onChange: (e) => setEquipment(e.target.value) },
            ["barbell", "dumbbell", "machine", "cable", "bodyweight"].map((eq) =>
              React.createElement(
                "option",
                { key: eq, value: eq },
                equipmentLabel(eq)
              )
            )
          )
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
          { type: "submit", className: "btn-primary", disabled: busy || !name.trim() },
          busy ? "저장 중..." : "저장"
        )
      )
    )
  );
}
