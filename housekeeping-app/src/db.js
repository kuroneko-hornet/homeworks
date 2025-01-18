// db.js (例)
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "./firebase";

const HISTORY_COLLECTION = "history";

/** 履歴を新規追加 */
export const addHistoryItem = async (title, assignedTo, assignedToUid) => {
  const historyRef = collection(db, HISTORY_COLLECTION);
  await addDoc(historyRef, {
    title,
    assignedTo,
    assignedToUid,
    completedAt: Timestamp.now() // 完了時刻
  });
};

/** 指定された日付範囲の履歴を取得 */
export const fetchHistoryByDateRange = async (startDate, endDate) => {
  // FirestoreのTimestampでの範囲クエリ
  const historyRef = collection(db, HISTORY_COLLECTION);

  // 例: completedAt が >= startDate AND < endDate
  // （startDate, endDate は JSのDateをFirestore Timestampに変換して比較）
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  const q = query(
    historyRef,
    where("completedAt", ">=", startTs),
    where("completedAt", "<", endTs),
    orderBy("completedAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

/** usersコレクションでdocを取得する */
export const getUserProfile = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data(); // { displayName: "..." }
  } else {
    return null;
  }
};

/** ユーザプロフィールを作成/更新する */
export const setUserProfile = async (uid, displayName) => {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { displayName }, { merge: true });
};

const CATALOG_COLLECTION = "choresCatalog";

/** 全カテゴリを取得 (全ユーザ共通) */
export const fetchAllCatalogs = async () => {
  const ref = collection(db, CATALOG_COLLECTION);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** 新規カテゴリ作成 */
export const createCatalog = async (mainCategory, subCats) => {
  const ref = collection(db, CATALOG_COLLECTION);
  await addDoc(ref, {
    mainCategory,
    subCategories: subCats // 例: ["リビング", "キッチン"]
  });
};

/** カテゴリの更新 (メインカテゴリ or サブカテゴリ配列) */
export const updateCatalog = async (docId, mainCategory, subCats) => {
  const ref = doc(db, CATALOG_COLLECTION, docId);
  await updateDoc(ref, {
    mainCategory,
    subCategories: subCats
  });
};

/** カテゴリの削除 */
export const deleteCatalog = async (docId) => {
  const ref = doc(db, CATALOG_COLLECTION, docId);
  await deleteDoc(ref);
};

export const deleteHistoryItem = async (historyId) => {
    const ref = doc(db, "history", historyId);
    await deleteDoc(ref);
  };