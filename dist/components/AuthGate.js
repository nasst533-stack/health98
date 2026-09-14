import React, { useState } from "https://esm.sh/react@18.3.1";
import { signUp, logIn } from "../store.js";
export function AuthGate() {
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!name.trim() || !password)
            return;
        if (mode === "signup") {
            if (!phone.trim()) {
                setError("전화번호를 입력해주세요.");
                return;
            }
            if (password !== password2) {
                setError("비밀번호가 서로 달라요.");
                return;
            }
            if (password.length < 6) {
                setError("비밀번호는 6자 이상으로 해주세요.");
                return;
            }
        }
        setBusy(true);
        try {
            if (mode === "signup") {
                await signUp({ name, phone, password });
            }
            else {
                await logIn({ name, password });
            }
            // 로그인/가입 성공 후에는 App.jsx의 onAuthStateChanged가 알아서 화면을 넘겨줍니다.
        }
        catch (err) {
            setError(err.message || "요청이 실패했어요.");
        }
        finally {
            setBusy(false);
        }
    }
    return React.createElement("div", { className: "profile-gate" }, React.createElement("h1", null, "HT98"), React.createElement("p", { className: "muted" }, mode === "signup" ? "이름/전화번호/비밀번호로 가입해주세요. 가입 후 마스터의 승인이 필요해요." : "이름과 비밀번호로 로그인해주세요."), React.createElement("form", { className: "profile-new-form", onSubmit: handleSubmit }, React.createElement("label", null, "이름 (아이디로 사용돼요)"), React.createElement("input", {
        type: "text",
        placeholder: "예: 민수",
        value: name,
        onChange: (e) => setName(e.target.value),
        autoFocus: true,
    }), mode === "signup" &&
        React.createElement(React.Fragment, null, React.createElement("label", null, "전화번호 (승인 확인용)"), React.createElement("input", {
            type: "tel",
            placeholder: "예: 010-1234-5678",
            value: phone,
            onChange: (e) => setPhone(e.target.value),
        })), React.createElement("label", null, "비밀번호"), React.createElement("input", {
        type: "password",
        value: password,
        onChange: (e) => setPassword(e.target.value),
    }), mode === "signup" &&
        React.createElement(React.Fragment, null, React.createElement("label", null, "비밀번호 확인"), React.createElement("input", {
            type: "password",
            value: password2,
            onChange: (e) => setPassword2(e.target.value),
        })), error && React.createElement("p", { style: { color: "var(--danger)", fontSize: "13px" } }, error), React.createElement("button", { type: "submit", className: "btn-primary", disabled: busy || !name.trim() || !password }, busy ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인")), React.createElement("button", {
        type: "button",
        className: "btn-secondary",
        style: { marginTop: 10, maxWidth: 280, marginLeft: "auto", marginRight: "auto", display: "block" },
        onClick: () => { setMode(mode === "signup" ? "login" : "signup"); setError(null); },
    }, mode === "signup" ? "이미 계정이 있어요 (로그인)" : "처음이에요 (가입하기)"));
}
