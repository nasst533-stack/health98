import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { DEFAULT_EXERCISES } from "./exercises-data.js";
import { DEFAULT_FOODS } from "./foods-data.js";
import {
  subscribeAuthState,
  subscribeMyProfile,
  subscribeFavorites,
  subscribeCustomExercises,
  logOut,
} from "./store.js";
import { AuthGate } from "./components/AuthGate.jsx";
import { PendingApproval } from "./components/PendingApproval.jsx";
import { AdminApprovalTab } from "./components/AdminApprovalTab.jsx";
import { Nav } from "./components/Nav.jsx";
import { ExerciseBrowser } from "./components/ExerciseBrowser.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { InbodyTab } from "./components/InbodyTab.jsx";
import { FoodTab } from "./components/FoodTab.jsx";

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = 아직 확인 전, null = 로그아웃 상태
  const [myProfile, setMyProfile] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [customExercises, setCustomExercises] = useState([]);
  const [tab, setTab] = useState("browse");

  useEffect(() => subscribeAuthState(setAuthUser), []);

  useEffect(() => {
    if (!authUser) {
      setMyProfile(null);
      return;
    }
    return subscribeMyProfile(authUser.uid, setMyProfile);
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    return subscribeFavorites(authUser.uid, setFavorites);
  }, [authUser]);

  useEffect(() => {
    return subscribeCustomExercises(setCustomExercises);
  }, []);

  const exercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...customExercises],
    [customExercises]
  );

  // 아직 로그인 상태 확인 전
  if (authUser === undefined) {
    return React.createElement("div", { className: "profile-gate" }, React.createElement("p", { className: "muted" }, "불러오는 중..."));
  }

  // 로그아웃 상태 -> 로그인/가입 화면
  if (!authUser) {
    return React.createElement(AuthGate);
  }

  // 로그인은 했지만 아직 profiles/{uid} 문서 구독이 안 끝났을 때
  if (!myProfile) {
    return React.createElement("div", { className: "profile-gate" }, React.createElement("p", { className: "muted" }, "불러오는 중..."));
  }

  // 승인 대기 중 (마스터는 항상 통과)
  if (!myProfile.approved && !myProfile.isMaster) {
    return React.createElement(PendingApproval, { profile: myProfile });
  }

  const profileId = authUser.uid;
  const goal = myProfile.goal || "유지";
  const currentTab = tab === "admin" && !myProfile.isMaster ? "browse" : tab;

  return React.createElement(
    "div",
    { className: "app-shell" },
    React.createElement(Nav, {
      current: currentTab,
      onChange: setTab,
      profileName: myProfile.name,
      isMaster: myProfile.isMaster,
      onLogout: logOut,
    }),
    React.createElement(
      "main",
      { className: "app-main" },
      currentTab === "browse" &&
        React.createElement(ExerciseBrowser, {
          exercises,
          favorites,
          profileId,
        }),
      currentTab === "history" && React.createElement(HistoryView, { profileId }),
      currentTab === "inbody" &&
        React.createElement(InbodyTab, { profileId, goal }),
      currentTab === "food" &&
        React.createElement(FoodTab, { foods: DEFAULT_FOODS, profileId, goal }),
      currentTab === "admin" && myProfile.isMaster && React.createElement(AdminApprovalTab)
    )
  );
}
