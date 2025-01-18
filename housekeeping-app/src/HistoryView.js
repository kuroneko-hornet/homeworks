// src/HistoryView.js
import { useEffect, useState } from "react";
import { fetchHistoryByDateRange } from "./db";
import { Timestamp } from "firebase/firestore";
import { addDays, format, startOfDay } from "date-fns";

// 担当者ごとに色分け (例: メールアドレスごとに手動マッピング)
const userColorMap = {
  "alice@example.com": "bg-blue-600",
  "bob@example.com": "bg-green-600",
  "carol@example.com": "bg-purple-600"
  // ...etc
};

// 新規ユーザが出た場合はランダムに色を割り当てたい場合はこちらで対応
// 例:  let assignedColor = availableColors[Math.floor(Math.random() * availableColors.length)]

// 日毎にグループ化
function groupByDate(historyList) {
  const grouped = {};
  historyList.forEach((item) => {
    // completedAt から "yyyy-MM-dd" 形式の日付文字列を作る
    const date = item.completedAt.toDate();
    const dayStr = format(date, "yyyy-MM-dd");
    if (!grouped[dayStr]) {
      grouped[dayStr] = [];
    }
    grouped[dayStr].push(item);
  });
  return grouped;
}

export default function HistoryView() {
  // (例) 初期表示: "今日を含む過去7日間"
  // startDateを (今日-6日) くらいに設定すると、今日含む7日間になる
  const today = startOfDay(new Date()); // 時刻 00:00 にそろえる
  const initialStart = addDays(today, -6);

  const [startDate, setStartDate] = useState(initialStart);
  const [historyData, setHistoryData] = useState([]);
  const [groupedData, setGroupedData] = useState({});

  // 1週間後 (endDate) を計算
  const endDate = addDays(startDate, 7);

  // 履歴を取得
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistoryByDateRange(startDate, endDate);
        setHistoryData(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    loadHistory();
  }, [startDate]); // startDate が変わるたびに再取得

  // 取得した履歴を日毎にまとめる
  useEffect(() => {
    const grouped = groupByDate(historyData);
    setGroupedData(grouped);
  }, [historyData]);

  // 「1週間前へ」ボタン
  const handlePrevWeek = () => {
    setStartDate((prev) => addDays(prev, -7));
  };

  // 「1週間後へ」ボタン
  const handleNextWeek = () => {
    setStartDate((prev) => addDays(prev, 7));
  };

  // 表示している週を文字列にする (例: "2025/01/12 - 2025/01/18")
  const dateRangeStr = `${format(startDate, "yyyy/MM/dd")} - ${format(
    addDays(startDate, 6),
    "yyyy/MM/dd"
  )}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* ヘッダー的なバー */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          1週間前へ
        </button>
        <h2 className="text-xl font-semibold text-gray-200">{dateRangeStr}</h2>
        <button
          onClick={handleNextWeek}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          1週間後へ
        </button>
      </div>

      {/* 履歴を日付ごとに表示 (時刻は表示しない) */}
      <div className="space-y-6">
        {Object.keys(groupedData)
          .sort() // 日付文字列を昇順に並べる
          .map((dateStr) => {
            const items = groupedData[dateStr];
            return (
              <div key={dateStr} className="bg-gray-800 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {dateStr}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    // 担当者ごとに色分け
                    const colorClass =
                      userColorMap[item.assignedTo] || "bg-pink-600";

                    return (
                      <div
                        key={item.id}
                        className="flex items-center bg-gray-700 rounded p-2"
                      >
                        {/* 担当者ラベル */}
                        <span
                          className={`text-xs font-bold text-white px-2 py-1 rounded mr-3 ${colorClass}`}
                        >
                          {item.assignedTo}
                        </span>
                        {/* 家事内容 */}
                        <span className="text-gray-100">{item.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
