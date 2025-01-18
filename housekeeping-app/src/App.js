/* src/App.js */
import { useEffect, useState } from "react";
import {
  loginWithGoogle,
  logout,
  onAuthChanged
} from "./auth";
import {
  addHistoryItem,
  fetchHistoryByDateRange,
  getUserProfile,
  setUserProfile,
  fetchAllCatalogs,
  deleteHistoryItem,
} from "./db";
import { format, addDays, startOfDay } from "date-fns";
import CategoryManager from "./CategoryManager";
import "./index.css";

const userColorMap = {
  "alice@example.com": "bg-blue-600",
  "bob@example.com": "bg-green-600",
  "carol@example.com": "bg-purple-600"
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState("");

  // ▼ カテゴリ
  const [categories, setCategories] = useState({}); // { "掃除": ["リビング", "キッチン"], ... }
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // ▼ カテゴリ管理画面の表示フラグ
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // ▼ 履歴表示用の state
  const today = startOfDay(new Date());
  const initialStart = addDays(today, -6);
  const [startDate, setStartDate] = useState(initialStart);
  const [historyData, setHistoryData] = useState([]);

  // -------------------------
  // ログイン監視 & ユーザ名チェック
  // -------------------------
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      if (!user) {
        setCurrentUser(null);
        setProfile(null);
        setIsNewUser(false);
        return;
      }
      setCurrentUser(user);
      // 初回かどうか
      const p = await getUserProfile(user.uid);
      if (!p) {
        setIsNewUser(true);
        setProfile(null);
      } else {
        setIsNewUser(false);
        setProfile(p);
      }
    });
    return () => unsubscribe();
  }, []);

  // -------------------------
  // 履歴読み込み
  // -------------------------
  const loadHistory = async () => {
    try {
      const endDate = addDays(startDate, 7);
      const data = await fetchHistoryByDateRange(startDate, endDate);
      setHistoryData(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };
  useEffect(() => {
    if (currentUser) {
      loadHistory();
    }
  }, [startDate, currentUser]);

  // -------------------------
  // カテゴリ読み込み
  // -------------------------
  const loadCategories = async () => {
    try {
      const catDocs = await fetchAllCatalogs();
      // 形: [{ id, mainCategory, subCategories:[] }, ...]
      // を { "掃除": ["リビング", "キッチン"], "洗濯": [...], ...} に変換
      const catMap = {};
      catDocs.forEach((doc) => {
        catMap[doc.mainCategory] = doc.subCategories;
      });
      setCategories(catMap);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  // マウント時 & ログイン後にカテゴリ読み込み
  useEffect(() => {
    if (currentUser) {
      loadCategories();
    }
  }, [currentUser]);

  // カテゴリ管理画面を閉じる → 最新カテゴリを再読込
  const handleCloseCategoryManager = () => {
    setShowCategoryManager(false);
    loadCategories(); // 再取得して画面に反映
  };

  // -------------------------
  // 初回ユーザ登録
  // -------------------------
  const handleRegisterDisplayName = async () => {
    if (!tempDisplayName || !currentUser) return;
    try {
      await setUserProfile(currentUser.uid, tempDisplayName);
      setProfile({ displayName: tempDisplayName });
      setIsNewUser(false);
    } catch (error) {
      console.error("Profile set error:", error);
    }
  };

  // -------------------------
  // 家事追加
  // -------------------------
  const handleAddChore = async () => {
    if (!selectedMainCategory || !selectedSubCategory) return;
    if (!currentUser) return;
    const title = `${selectedMainCategory}/${selectedSubCategory}`;
    try {
      await addHistoryItem(title, profile.displayName, currentUser.uid);
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
      loadHistory();
    } catch (error) {
      console.error("Add history error:", error);
    }
  };

  const handleDeleteHistory = async (itemId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      await deleteHistoryItem(itemId);
      // 削除後、再読み込み
      loadHistory();
    } catch (error) {
      console.error("Delete history error:", error);
    }
  };

  // 履歴週移動
  const handlePrevWeek = () => {
    setStartDate((prev) => addDays(prev, -7));
  };
  const handleNextWeek = () => {
    setStartDate((prev) => addDays(prev, 7));
  };

  // 履歴のグルーピング
  const groupByDate = (list) => {
    const result = {};
    list.forEach((item) => {
      const dateKey = format(item.completedAt.toDate(), "yyyy-MM-dd");
      if (!result[dateKey]) result[dateKey] = [];
      result[dateKey].push(item);
    });
    return result;
  };
  const grouped = groupByDate(historyData);
  const dateRangeStr = `${format(startDate, "yyyy/MM/dd")} - ${format(
    addDays(startDate, 6),
    "yyyy/MM/dd"
  )}`;

  // --------------------------------------
  // 表示
  // --------------------------------------
  if (!currentUser) {
    // ログイン前
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-200">
        <div className="bg-gray-800 p-6 rounded-md">
          <h1 className="text-xl font-bold mb-4">ルームシェア家事管理</h1>
          <p className="mb-2">ログインしてください</p>
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  if (isNewUser) {
    // 初回ユーザ名登録
    return (
      <div className="min-h-screen bg-slate-800 text-white flex items-center justify-center">
        <div className="p-6 bg-gray-700 rounded-md">
          <h2 className="text-xl font-bold mb-2">初回登録</h2>
          <div className="mb-2">
            <label className="block mb-1">ユーザ名:</label>
            <input
              className="px-3 py-2 text-black rounded"
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              placeholder="例: Taro"
            />
          </div>
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded"
            onClick={handleRegisterDisplayName}
          >
            登録
          </button>
        </div>
      </div>
    );
  }

  // ログイン後の画面
  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      {/* ヘッダー */}
      <header className="max-w-4xl mx-auto py-4 px-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ルームシェア家事管理</h1>
        <div className="flex items-center space-x-3">
          {/* カテゴリ管理 ボタン (ログアウトの左側) */}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            カテゴリ管理
          </button>
          <div>
            <p className="text-sm text-gray-300 mb-1">
              ログインユーザー: {profile?.displayName}
            </p>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* カテゴリ管理画面 */}
      {showCategoryManager && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <CategoryManager onClose={handleCloseCategoryManager} />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 space-y-8 pb-8">
        {/* 家事の追加 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">家事の追加</h2>
          <div className="bg-gray-800 p-4 rounded-md shadow-sm">
            {/* メインカテゴリ選択 */}
            {!selectedMainCategory && (
              <div className="space-y-2">
                <p className="mb-2">メインカテゴリを選択:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(categories).map((mainCat) => (
                    <button
                      key={mainCat}
                      onClick={() => setSelectedMainCategory(mainCat)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
                    >
                      {mainCat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* サブカテゴリ選択 */}
            {selectedMainCategory && !selectedSubCategory && (
              <div className="space-y-2">
                <p className="mb-2">
                  「{selectedMainCategory}」のサブカテゴリを選択:
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories[selectedMainCategory]?.map((subCat) => (
                    <button
                      key={subCat}
                      onClick={() => setSelectedSubCategory(subCat)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
                    >
                      {subCat}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedMainCategory(null)}
                  className="mt-4 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
                >
                  戻る
                </button>
              </div>
            )}

            {/* 確認 & 追加 */}
            {selectedMainCategory && selectedSubCategory && (
              <div className="space-y-2">
                <p className="mb-2">
                  追加する家事:{" "}
                  <span className="font-medium">
                    {selectedMainCategory}/{selectedSubCategory}
                  </span>
                </p>
                <button
                  onClick={handleAddChore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
                >
                  家事を完了として記録
                </button>
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className="ml-3 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
                >
                  サブカテゴリを選び直す
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 履歴表示 (1週間分) */}
        <section>
          <h2 className="text-xl font-semibold mb-3">履歴</h2>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              1週間前へ
            </button>
            <span className="font-semibold text-gray-200">{dateRangeStr}</span>
            <button
              onClick={handleNextWeek}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              1週間後へ
            </button>
          </div>
          {/* 日付ごとに表示 */}
          <div className="space-y-6">
            {Object.keys(grouped)
              .sort()
              .map((dayStr) => {
                const items = grouped[dayStr];
                return (
                    <div key={dayStr} className="bg-gray-800 p-4 rounded-md shadow-sm">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {dayStr}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => {
                          // 自分の履歴かどうか確認
                          const isMine = (item.assignedToUid === currentUser.uid);
                          // あるいは (item.assignedTo === profile.displayName) でも可
                          const colorClass =
                            userColorMap[item.assignedTo] || "bg-pink-600";
        
                          return (
                            <div
                              key={item.id}
                              className="flex items-center bg-gray-700 rounded p-2"
                            >
                              {/* 担当者表示 */}
                              <span
                                className={`text-xs font-bold text-white px-2 py-1 rounded mr-3 ${colorClass}`}
                              >
                                {item.assignedTo}
                              </span>
                              {/* 家事タイトル */}
                              <span className="text-gray-100 flex-1">
                                {item.title}
                              </span>
        
                              {/* 自分の履歴のみ削除ボタンを表示 */}
                              {isMine && (
                                <button
                                  className="ml-2 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition"
                                  onClick={() => handleDeleteHistory(item.id)}
                                >
                                  削除
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                
              })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
