import React from "https://esm.sh/react@18.3.1";

// 프로필 칩(👤 이름)을 누르면 뜨는 "내 설정" 시트. 밝은/어두운 테마를 고르고,
// 여기서 로그아웃도 할 수 있어요.
export function SettingsModal({ profileName, theme, onSetTheme, onLogout, onClose }) {
  return React.createElement(
    "div",
    { className: "modal-backdrop", onClick: onClose },
    React.createElement(
      "div",
      { className: "modal", onClick: (e) => e.stopPropagation() },
      React.createElement(
        "div",
        { className: "settings-profile-row" },
        React.createElement("div", { className: "settings-avatar" }, (profileName || "?").slice(0, 1)),
        React.createElement("div", { className: "settings-name" }, profileName)
      ),

      React.createElement("h3", null, "화면 테마"),
      React.createElement(
        "div",
        { className: "theme-toggle-row" },
        React.createElement(
          "button",
          {
            type: "button",
            className: "theme-btn" + (theme === "light" ? " active" : ""),
            onClick: () => onSetTheme("light"),
          },
          React.createElement("span", { className: "theme-btn-emoji" }, "☀️"),
          "밝은 테마"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            className: "theme-btn" + (theme === "dark" ? " active" : ""),
            onClick: () => onSetTheme("dark"),
          },
          React.createElement("span", { className: "theme-btn-emoji" }, "🌙"),
          "어두운 테마"
        )
      ),

      React.createElement(
        "button",
        { type: "button", className: "settings-logout-btn", onClick: onLogout },
        "로그아웃"
      ),
      React.createElement(
        "button",
        { type: "button", className: "btn-secondary", style: { marginTop: 8 }, onClick: onClose },
        "닫기"
      )
    )
  );
}
