import React from "https://esm.sh/react@18.3.1";
// 아주 단순한 SVG 라인 차트 (외부 라이브러리 없이 직접 구현)
// points: [{ label: string, value: number }]
// colorVar: 이 차트만 다른 색으로 그리고 싶을 때 CSS 색상 값(예: "var(--accent-2)")을 넘깁니다.
export function LineChart({ points, height = 180, valueSuffix = "", colorVar }) {
    if (!points || points.length === 0) {
        return React.createElement("div", { className: "chart-empty" }, "아직 기록이 없어요.");
    }
    const width = Math.max(320, points.length * 56);
    const padding = 28;
    const values = points.map((p) => p.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);
    const yFor = (v) => height - padding - ((v - min) / range) * (height - padding * 2);
    const xFor = (i) => padding + i * xStep;
    const path = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
        .join(" ");
    const color = colorVar || "var(--accent)";
    return React.createElement("div", { className: "chart-scroll" }, React.createElement("svg", { width, height, className: "line-chart" }, React.createElement("path", {
        d: path,
        fill: "none",
        stroke: color,
        strokeWidth: 2.5,
    }), points.map((p, i) => React.createElement("g", { key: i }, React.createElement("circle", {
        cx: xFor(i),
        cy: yFor(p.value),
        r: 4,
        fill: color,
    }), React.createElement("text", {
        x: xFor(i),
        y: yFor(p.value) - 10,
        fontSize: 11,
        textAnchor: "middle",
        className: "chart-value",
    }, `${p.value}${valueSuffix}`), React.createElement("text", {
        x: xFor(i),
        y: height - 8,
        fontSize: 10,
        textAnchor: "middle",
        className: "chart-label",
    }, p.label)))));
}
