// Firestore + Firebase Auth 데이터 접근 helper 모음.
//
// 로그인 방식: 이름 + 비밀번호 (+ 가입 시 전화번호). Firebase Auth의 이메일/비밀번호
// 로그인 방식을 그대로 쓰되, 실제 이메일 대신 이름에서 만든 가짜 이메일
// (예: "민수" -> "민수@heoljang.local")을 내부적으로 사용합니다. 그래서 같은 이름으로는
// 가입이 안 돼요(자동으로 중복 이름 방지가 됨).
//
// 가입만으로는 바로 못 쓰고, "마스터" 권한을 가진 사람이 승인해야 로그인해서 쓸 수 있어요.
// 맨 처음 가입하는 사람(=이 앱을 만든 사람)은 가입 직후 Firebase 콘솔의 Firestore 데이터 탭에서
// 본인의 profiles/{uid} 문서를 열어 approved:true, isMaster:true로 직접 한 번 바꿔주면 됩니다
// (그 이후로는 마스터가 이 앱 안의 "승인" 탭에서 나머지 사람들을 승인해주면 돼요).
//
// 컬렉션 구조:
//   profiles/{uid}                   { name, phone, approved, isMaster, goal(선택), createdAt }
//   favorites/{profileId_exerciseId} { profileId, exerciseId, createdAt }
//   customExercises/{id}            { name, category, equipment, type, createdAt }
//   logs/{id}                       { profileId, exerciseId, exerciseName, category,
//                                      equipment, type, date, sets|cardio fields, volume, createdAt }
//   customFoods/{id}                { name, kcalPer100g, category, protein, fat, carb,
//                                      saturatedFat, unitLabel, unitGrams, createdAt }
//   foodLogs/{id}                   { profileId, foodId, foodName, kcalPer100g, grams, kcal, date,
//                                      proteinG, fatG, carbG, satFatG, createdAt }
//   inbodyLogs/{id}                 { profileId, date, weight, skeletalMuscle, bodyFatPercent,
//                                      bodyFatMass, bmi, score, createdAt }
import { db, auth } from "./firebase-config.js";
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// 이름 -> 내부용 가짜 이메일. 같은 이름이면 같은 이메일이 되므로
// Firebase Auth가 자동으로 이름 중복 가입을 막아줍니다.
function emailForName(name) {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    return `${slug}@heoljang.local`;
}
function authErrorMessage(err) {
    const code = err && err.code;
    if (code === "auth/email-already-in-use")
        return "이미 사용 중인 이름이에요. 다른 이름으로 가입해주세요.";
    if (code === "auth/weak-password")
        return "비밀번호가 너무 짧아요 (6자 이상 입력해주세요).";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential")
        return "이름 또는 비밀번호가 올바르지 않아요.";
    if (code === "auth/wrong-password")
        return "비밀번호가 올바르지 않아요.";
    if (code === "auth/too-many-requests")
        return "시도가 너무 많았어요. 잠시 후 다시 시도해주세요.";
    return "요청이 실패했어요. 다시 시도해주세요.";
}
// ---------- Auth ----------
export function subscribeAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}
export async function signUp({ name, phone, password }) {
    const email = emailForName(name);
    let cred;
    try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
    }
    catch (err) {
        throw new Error(authErrorMessage(err));
    }
    await setDoc(doc(db, "profiles", cred.user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        approved: false,
        isMaster: false,
        createdAt: serverTimestamp(),
    });
    return cred.user.uid;
}
export async function logIn({ name, password }) {
    const email = emailForName(name);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }
    catch (err) {
        throw new Error(authErrorMessage(err));
    }
}
export async function logOut() {
    await signOut(auth);
}
// ---------- Profiles ----------
export function subscribeMyProfile(uid, callback) {
    return onSnapshot(doc(db, "profiles", uid), (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
}
// 마스터의 "승인" 탭: 아직 승인되지 않은 가입자 목록 (이름 + 전화번호 확인용)
export function subscribePendingProfiles(callback) {
    return onSnapshot(query(collection(db, "profiles"), where("approved", "==", false)), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
export async function approveProfile(uid) {
    await updateDoc(doc(db, "profiles", uid), { approved: true });
}
// 다이어트 / 유지 / 벌크업 목표 (인바디 탭에서 선택)
export async function setProfileGoal(profileId, goal) {
    await setDoc(doc(db, "profiles", profileId), { goal }, { merge: true });
}
// ---------- Favorites ----------
export function subscribeFavorites(profileId, callback) {
    return onSnapshot(query(collection(db, "favorites"), where("profileId", "==", profileId)), (snap) => callback(new Set(snap.docs.map((d) => d.data().exerciseId))));
}
export async function setFavorite(profileId, exerciseId, isFav) {
    const id = `${profileId}_${exerciseId}`;
    if (isFav) {
        await setDoc(doc(db, "favorites", id), {
            profileId,
            exerciseId,
            createdAt: serverTimestamp(),
        });
    }
    else {
        await deleteDoc(doc(db, "favorites", id));
    }
}
// ---------- Custom exercises ----------
export function subscribeCustomExercises(callback) {
    return onSnapshot(query(collection(db, "customExercises"), orderBy("createdAt", "asc")), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data(), builtin: false }))));
}
export async function addCustomExercise({ name, category, equipment, type }) {
    await addDoc(collection(db, "customExercises"), {
        name,
        category,
        equipment,
        type: type || "strength",
        createdAt: serverTimestamp(),
    });
}
// ---------- Logs (workout) ----------
export async function addLog(logData) {
    await addDoc(collection(db, "logs"), {
        ...logData,
        createdAt: serverTimestamp(),
    });
}
export async function updateLog(id, patch) {
    const { id: _omit, ...rest } = patch;
    await updateDoc(doc(db, "logs", id), rest);
}
export async function deleteLog(id) {
    await deleteDoc(doc(db, "logs", id));
}
export function subscribeLogsForProfile(profileId, callback) {
    return onSnapshot(query(collection(db, "logs"), where("profileId", "==", profileId), orderBy("date", "desc")), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
// ---------- Custom foods ----------
export function subscribeCustomFoods(callback) {
    return onSnapshot(query(collection(db, "customFoods"), orderBy("createdAt", "asc")), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data(), builtin: false }))));
}
export async function addCustomFood({ name, kcalPer100g, category, protein, fat, carb, saturatedFat, unitLabel, unitGrams, }) {
    await addDoc(collection(db, "customFoods"), {
        name,
        kcalPer100g,
        category: category || "기타",
        protein: protein != null ? protein : null,
        fat: fat != null ? fat : null,
        carb: carb != null ? carb : null,
        saturatedFat: saturatedFat != null ? saturatedFat : null,
        unitLabel: unitLabel || null,
        unitGrams: unitGrams != null ? unitGrams : null,
        createdAt: serverTimestamp(),
    });
}
// ---------- Food logs ----------
export async function addFoodLog(logData) {
    await addDoc(collection(db, "foodLogs"), {
        ...logData,
        createdAt: serverTimestamp(),
    });
}
export async function deleteFoodLog(id) {
    await deleteDoc(doc(db, "foodLogs", id));
}
export function subscribeFoodLogsForProfile(profileId, callback) {
    return onSnapshot(query(collection(db, "foodLogs"), where("profileId", "==", profileId), orderBy("date", "desc")), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
// ---------- InBody logs ----------
export async function addInbodyLog(logData) {
    await addDoc(collection(db, "inbodyLogs"), {
        ...logData,
        createdAt: serverTimestamp(),
    });
}
export async function deleteInbodyLog(id) {
    await deleteDoc(doc(db, "inbodyLogs", id));
}
export function subscribeInbodyLogsForProfile(profileId, callback) {
    return onSnapshot(query(collection(db, "inbodyLogs"), where("profileId", "==", profileId), orderBy("date", "asc")), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}
