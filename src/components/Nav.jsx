import React from "https://esm.sh/react@18.3.1";

const BASE_TABS = [
  { id: "browse", label: "운동", icon: "🏋️" },
  { id: "history", label: "기록", icon: "📈" },
  { id: "inbody", label: "인바디", icon: "📊" },
  { id: "food", label: "식단", icon: "🍚" },
];

const ADMIN_TAB = { id: "admin", label: "승인", icon: "✅" };

export function Nav({ current, onChange, profileName, isMaster, onLogout }) {
  const tabs = isMaster ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  return React.createElement(
    "div",
    { className: "app-header" },
    React.createElement(
      "div",
      { className: "app-title-row" },
      React.createElement("h1", { className: "app-title" }, "헬창게이들"),
      React.createElement(
        "button",
        { className: "profile-chip", onClick: onLogout, title: "로그아웃" },
        "👤 ",
        profileName,
        " · 로그아웃"
      )
    ),
    React.createElement(
      "nav",
      { className: "tab-bar" },
      tabs.map((t) =>
        React.createElement(
          "button",
          {
            key: t.id,
            className: "tab-btn" + (current === t.id ? " active" : ""),
            onClick: () => onChange(t.id),
          },
          React.createElement("span", { className: "tab-icon" }, t.icon),
          React.createElement("span", null, t.label)
        )
      )
    )
  );
}
