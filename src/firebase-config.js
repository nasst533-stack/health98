// ⚠️ Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 만든 뒤
// "프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성"에서 나오는 값으로 아래를 채워주세요.
// README.md의 "1. Firebase 프로젝트 만들기" 단계를 참고하세요.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCU9CyDijEtfJsFsJ1CQVThltavFNCsmZs",
  authDomain: "health98-17724.firebaseapp.com",
  projectId: "health98-17724",
  storageBucket: "health98-17724.firebasestorage.app",
  messagingSenderId: "993392911013",
  appId: "1:993392911013:web:aab0efaa2724fbccbce34c",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 로그인/회원가입 자체는 store.js의 signUp()/logIn()이 처리합니다.
// (예전엔 익명 로그인을 자동으로 걸었지만, 이제는 이름+비밀번호로 직접
//  로그인하는 방식이라 여기서 자동 로그인을 시도하지 않아요.)
