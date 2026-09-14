import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";

const DISMISS_KEY = "workout-app:install-banner-dismissed";

// TINUM 같은 앱처럼 "홈 화면에 설치" 안내를 화면 위에 띄워주는 배너.
// 이미 앱(홈 화면 아이콘)으로 실행 중이면 아무것도 안 보여줘요.
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    let standalone = false;
    try {
      standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
    } catch (e) {
      /* 무시 */
    }
    setIsStandalone(standalone);

    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch (e) {
      /* localStorage 사용 불가 환경이면 그냥 배너를 보여줌 */
    }

    try {
      setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    } catch (e) {
      /* 무시 */
    }

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      /* 무시 */
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (e) {
      /* 무시 */
    }
    setDeferredPrompt(null);
  }

  if (isStandalone || dismissed) return null;
  // 안드로이드 크롬처럼 설치 신호가 온 경우, 또는 iOS(수동 안내)일 때만 보여줘요.
  if (!deferredPrompt && !isIOS) return null;

  return React.createElement(
    "div",
    { className: "install-banner" },
    React.createElement(
      "span",
      null,
      deferredPrompt
        ? "📱 이 앱을 홈 화면에 설치하면 진짜 앱처럼 쓸 수 있어요."
        : "📱 하단 공유 아이콘 → \"홈 화면에 추가\"를 누르면 앱처럼 설치돼요."
    ),
    deferredPrompt &&
      React.createElement(
        "button",
        { type: "button", className: "install-banner-btn", onClick: handleInstall },
        "설치하기"
      ),
    React.createElement(
      "button",
      { type: "button", className: "install-banner-close", onClick: dismiss, "aria-label": "닫기" },
      "✕"
    )
  );
}
