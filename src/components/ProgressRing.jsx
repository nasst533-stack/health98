import React from "https://esm.sh/react@18.3.1";

// 목표 달성률처럼 "얼마나 왔는지"를 도넛형 링 + 가운데 큰 숫자로 보여주는 컴포넌트.
export function ProgressRing({ percent, label, sublabel, size = 116, stroke = 10 }) {
  const p = percent == null ? 0 : Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);

  return React.createElement(
    "div",
    { className: "ring-tile" },
    React.createElement(
      "div",
      { className: "ring-svg-wrap", style: { width: size, height: size } },
      React.createElement(
        "svg",
        { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
        React.createElement("circle", {
          cx: size / 2,
          cy: size / 2,
          r,
          fill: "none",
          stroke: "var(--surface-2)",
          strokeWidth: stroke,
        }),
        percent != null &&
          React.createElement("circle", {
            cx: size / 2,
            cy: size / 2,
            r,
            fill: "none",
            stroke: "var(--accent)",
            strokeWidth: stroke,
            strokeLinecap: "round",
            strokeDasharray: c,
            strokeDashoffset: offset,
            transform: `rotate(-90 ${size / 2} ${size / 2})`,
            style: { transition: "stroke-dashoffset 0.5s ease" },
          })
      ),
      React.createElement(
        "div",
        { className: "ring-center" },
        React.createElement("strong", null, percent == null ? "-" : `${percent}%`)
      )
    ),
    React.createElement("div", { className: "ring-label" }, label),
    sublabel && React.createElement("div", { className: "ring-sublabel" }, sublabel)
  );
}
