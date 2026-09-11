import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";
import { subscribePendingProfiles, approveProfile } from "../store.js";
export function AdminApprovalTab() {
    const [pending, setPending] = useState([]);
    useEffect(() => subscribePendingProfiles(setPending), []);
    return React.createElement("div", null, React.createElement("h2", null, "가입 승인 대기"), React.createElement("p", { className: "muted" }, "이름과 전화번호를 확인하고 아는 사람이면 승인해주세요."), React.createElement("div", { className: "history-list" }, pending.length === 0 && React.createElement("p", { className: "muted" }, "대기 중인 가입 요청이 없어요."), pending.map((p) => React.createElement("div", { className: "history-row", key: p.id }, React.createElement("div", null, React.createElement("strong", { className: "history-exname" }, p.name), React.createElement("div", { className: "history-detail" }, p.phone || "전화번호 없음")), React.createElement("button", { type: "button", className: "btn-primary", style: { width: "auto", padding: "8px 14px" }, onClick: () => approveProfile(p.id) }, "승인")))));
}
