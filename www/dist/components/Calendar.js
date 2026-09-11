import React from "https://esm.sh/react@18.3.1";
import { todayStr } from "../utils.js";
// 월간 달력. 날짜 칸마다 그날의 총 볼륨(kg)과 섭취 칼로리(kcal)를 같이 보여줍니다.
export function MonthCalendar({ year, month, // 0-11
volumeByDate, kcalByDate, selectedDate, onSelectDate, onPrevMonth, onNextMonth, }) {
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayStr();
    const cells = [];
    for (let i = 0; i < startDow; i++)
        cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
        cells.push(d);
    function dateStrFor(d) {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return React.createElement("div", null, React.createElement("div", { className: "cal-header" }, React.createElement("button", { type: "button", className: "cal-nav-btn", onClick: onPrevMonth, "aria-label": "이전 달" }, "‹"), React.createElement("span", { className: "cal-title" }, `${year}년 ${month + 1}월`), React.createElement("button", { type: "button", className: "cal-nav-btn", onClick: onNextMonth, "aria-label": "다음 달" }, "›")), React.createElement("div", { className: "cal-legend" }, React.createElement("span", null, React.createElement("span", { className: "cal-dot" }), " 볼륨(kg)"), React.createElement("span", null, React.createElement("span", { className: "cal-dot food" }), " 섭취(kcal)")), React.createElement("div", { className: "cal-grid" }, ["일", "월", "화", "수", "목", "금", "토"].map((dw) => React.createElement("span", { key: dw, className: "cal-dow" }, dw)), cells.map((d, i) => {
        if (d === null) {
            return React.createElement("span", { key: `e${i}`, className: "cal-day empty" });
        }
        const ds = dateStrFor(d);
        const vol = volumeByDate[ds] || 0;
        const kcal = kcalByDate[ds] || 0;
        const cls = "cal-day" + (ds === today ? " today" : "") + (ds === selectedDate ? " selected" : "");
        return React.createElement("button", {
            type: "button",
            key: ds,
            className: cls,
            onClick: () => onSelectDate(ds === selectedDate ? null : ds),
        }, React.createElement("span", { className: "cal-daynum" }, d), vol > 0
            ? React.createElement("span", { className: "cal-vol" }, `${Math.round(vol)}kg`)
            : React.createElement("span", { className: "cal-vol empty-line" }), kcal > 0
            ? React.createElement("span", { className: "cal-kcal" }, `${Math.round(kcal)}kcal`)
            : React.createElement("span", { className: "cal-kcal empty-line" }));
    })));
}
