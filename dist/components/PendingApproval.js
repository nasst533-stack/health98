import React from "https://esm.sh/react@18.3.1";
import { logOut } from "../store.js";
export function PendingApproval({ profile }) {
    return React.createElement("div", { className: "profile-gate" }, React.createElement("h1", null, "승인 대기 중이에요"), React.createElement("p", { className: "muted" }, `${profile.name}님, 가입해주셔서 감사해요. 마스터가 승인하면 바로 쓰실 수 있어요.`), React.createElement("div", { className: "note-box", style: { textAlign: "left", margin: "16px auto", maxWidth: 320 } }, `등록하신 정보 — 이름: ${profile.name} / 전화번호: ${profile.phone || "-"}`), React.createElement("button", {
        type: "button",
        className: "btn-secondary",
        style: { maxWidth: 200, margin: "0 auto", display: "block" },
        onClick: () => logOut(),
    }, "로그아웃"));
}
