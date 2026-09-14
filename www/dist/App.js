import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { DEFAULT_EXERCISES } from "./exercises-data.js";
import { DEFAULT_FOODS } from "./foods-data.js";
import { subscribeAuthState, subscribeMyProfile, subscribeFavorites, subscribeCustomExercises, logOut, } from "./store.js";
import { InstallBanner } from "./components/InstallBanner.js";
import { AuthGate } from "./components/AuthGate.js";
import { PendingApproval } from "./components/PendingApproval.js";
import { AdminApprovalTab } from "./components/AdminApprovalTab.js";
import { Nav } from "./components/Nav.js";
import { ExerciseBrowser } from "./components/ExerciseBrowser.js";
import { HistoryView } from "./components/HistoryView.js";
import { InbodyTab } from "./components/InbodyTab.js";
import { FoodTab } from "./components/FoodTab.js";
import { SettingsModal } from "./components/SettingsModal.js";
function getStoredTheme() {
    try {
        const t = localStorage.getItem("theme");
        return t === "light" || t === "dark" ? t : "dark";
    }
    catch (e) {
        return "dark";
    }
}
export default function App() {
    const [authUser, setAuthUser] = useState(undefined); // undefined = 아직 확인 전, null = 로그아웃 상태
    const [myProfile, setMyProfile] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [customExercises, setCustomExercises] = useState([]);
    const [tab, setTab] = useState("browse");
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState(getStoredTheme);
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem("theme", theme);
        }
        catch (e) {
            /* 프라이빗 브라우징 등에서 저장이 안 돼도 화면 표시엔 문제 없음 */
        }
    }, [theme]);
    useEffect(() => subscribeAuthState(setAuthUser), []);
    useEffect(() => {
        if (!authUser) {
            setMyProfile(null);
            return;
        }
        return subscribeMyProfile(authUser.uid, setMyProfile);
    }, [authUser]);
    useEffect(() => {
        if (!authUser)
            return;
        return subscribeFavorites(authUser.uid, setFavorites);
    }, [authUser]);
    useEffect(() => {
        return subscribeCustomExercises(setCustomExercises);
    }, []);
    const exercises = useMemo(() => [...DEFAULT_EXERCISES, ...customExercises], [customExercises]);
    // 아직 로그인 상태 확인 전
    if (authUser === undefined) {
        return React.createElement(React.Fragment, null, React.createElement(InstallBanner), React.createElement("div", { className: "profile-gate" }, React.createElement("p", { className: "muted" }, "불러오는 중...")));
    }
    // 로그아웃 상태 -> 로그인/가입 화면
    if (!authUser) {
        return React.createElement(React.Fragment, null, React.createElement(InstallBanner), React.createElement(AuthGate));
    }
    // 로그인은 했지만 아직 profiles/{uid} 문서 구독이 안 끝났을 때
    if (!myProfile) {
        return React.createElement(React.Fragment, null, React.createElement(InstallBanner), React.createElement("div", { className: "profile-gate" }, React.createElement("p", { className: "muted" }, "불러오는 중...")));
    }
    // 승인 대기 중 (마스터는 항상 통과)
    if (!myProfile.approved && !myProfile.isMaster) {
        return React.createElement(React.Fragment, null, React.createElement(InstallBanner), React.createElement(PendingApproval, { profile: myProfile }));
    }
    const profileId = authUser.uid;
    const goal = myProfile.goal || "유지";
    const currentTab = tab === "admin" && !myProfile.isMaster ? "browse" : tab;
    return React.createElement("div", { className: "app-shell" }, React.createElement(InstallBanner), React.createElement(Nav, {
        current: currentTab,
        onChange: setTab,
        profileName: myProfile.name,
        isMaster: myProfile.isMaster,
        onOpenSettings: () => setShowSettings(true),
    }), React.createElement("main", { className: "app-main" }, currentTab === "browse" &&
        React.createElement(ExerciseBrowser, {
            exercises,
            favorites,
            profileId,
        }), currentTab === "history" && React.createElement(HistoryView, { profileId }), currentTab === "inbody" &&
        React.createElement(InbodyTab, { profileId, goal, isMaster: myProfile.isMaster, profile: myProfile }), currentTab === "food" &&
        React.createElement(FoodTab, { foods: DEFAULT_FOODS, profileId, goal }), currentTab === "admin" && myProfile.isMaster && React.createElement(AdminApprovalTab)), showSettings &&
        React.createElement(SettingsModal, {
            profileName: myProfile.name,
            theme,
            onSetTheme: setTheme,
            onLogout: logOut,
            onClose: () => setShowSettings(false),
        }));
}
