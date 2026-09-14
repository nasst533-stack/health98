import React from "https://esm.sh/react@18.3.1";
import { IconDumbbell, IconBowl, IconChart, IconHistory, IconCheck } from "./Icons.js";
const BASE_TABS = [
    { id: "browse", label: "운동", Icon: IconDumbbell },
    { id: "food", label: "식단", Icon: IconBowl },
    { id: "inbody", label: "인바디", Icon: IconChart },
    { id: "history", label: "기록", Icon: IconHistory },
];
const ADMIN_TAB = { id: "admin", label: "승인", Icon: IconCheck };
export function Nav({ current, onChange, profileName, isMaster, onOpenSettings }) {
    const tabs = isMaster ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;
    return React.createElement("div", { className: "app-header" }, React.createElement("div", { className: "app-title-row" }, React.createElement("h1", { className: "app-title" }, "HT98"), React.createElement("button", { className: "profile-chip", onClick: onOpenSettings, title: "내 설정" }, profileName)), React.createElement("nav", { className: "tab-bar" }, tabs.map((t) => React.createElement("button", {
        key: t.id,
        className: "tab-btn" + (current === t.id ? " active" : ""),
        onClick: () => onChange(t.id),
    }, React.createElement("span", { className: "tab-icon" }, React.createElement(t.Icon)), React.createElement("span", null, t.label)))));
}
