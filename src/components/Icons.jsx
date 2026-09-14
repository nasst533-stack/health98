import React from "https://esm.sh/react@18.3.1";

// 탭바용 심플한 선(line) 아이콘 모음 — 컬러풀한 이모지 대신 currentColor 하나로
// 그려서, 탭이 활성화됐을 때 색만 자연스럽게 accent 컬러로 바뀌어요.
function svg(paths, viewBox) {
  return React.createElement(
    "svg",
    {
      viewBox: viewBox || "0 0 24 24",
      width: 20,
      height: 20,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    paths
  );
}

// 운동 (덤벨)
export function IconDumbbell() {
  return svg([
    React.createElement("path", { key: 1, d: "M4 9v6" }),
    React.createElement("path", { key: 2, d: "M2 10.5v3" }),
    React.createElement("path", { key: 3, d: "M20 9v6" }),
    React.createElement("path", { key: 4, d: "M22 10.5v3" }),
    React.createElement("path", { key: 5, d: "M7 7v10" }),
    React.createElement("path", { key: 6, d: "M17 7v10" }),
    React.createElement("path", { key: 7, d: "M7 12h10" }),
  ]);
}

// 식단 (그릇 + 수저)
export function IconBowl() {
  return svg([
    React.createElement("path", { key: 1, d: "M3 11h18" }),
    React.createElement("path", { key: 2, d: "M4 11a8 6 0 0 0 16 0" }),
    React.createElement("path", { key: 3, d: "M12 11V4" }),
    React.createElement("path", { key: 4, d: "M9 4v3" }),
    React.createElement("path", { key: 5, d: "M15 17v2.5" }),
  ]);
}

// 인바디 (막대 그래프)
export function IconChart() {
  return svg([
    React.createElement("rect", { key: 1, x: 4, y: 12, width: 3.5, height: 7, rx: 1 }),
    React.createElement("rect", { key: 2, x: 10.3, y: 7, width: 3.5, height: 12, rx: 1 }),
    React.createElement("rect", { key: 3, x: 16.5, y: 3, width: 3.5, height: 16, rx: 1 }),
  ]);
}

// 기록 (되돌아보는 시계)
export function IconHistory() {
  return svg([
    React.createElement("path", { key: 1, d: "M3 12a9 9 0 1 0 3-6.7" }),
    React.createElement("path", { key: 2, d: "M3 4v4.5h4.5" }),
    React.createElement("path", { key: 3, d: "M12 8v4.5l3 2" }),
  ]);
}

// 승인 (체크)
export function IconCheck() {
  return svg([
    React.createElement("circle", { key: 1, cx: 12, cy: 12, r: 9 }),
    React.createElement("path", { key: 2, d: "M8 12.5l2.5 2.5L16 9.5" }),
  ]);
}
