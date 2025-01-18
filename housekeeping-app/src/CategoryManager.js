/* src/CategoryManager.js */
import React, { useState, useEffect } from "react";
import {
  fetchAllCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog
} from "./db";

export default function CategoryManager({ onClose }) {
  // 一覧
  const [catalogs, setCatalogs] = useState([]);

  // 新規作成フォーム
  const [newMainCat, setNewMainCat] = useState("");
  const [newSubCats, setNewSubCats] = useState("");

  // 編集モーダル用
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [editMainCat, setEditMainCat] = useState("");
  const [editSubCats, setEditSubCats] = useState("");

  // カタログ読み込み
  const loadCatalogs = async () => {
    try {
      const data = await fetchAllCatalogs();
      setCatalogs(data);
    } catch (error) {
      console.error("Failed to fetch catalogs:", error);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadCatalogs();
  }, []);

  // 新規カテゴリ追加
  const handleCreate = async () => {
    if (!newMainCat) return;
    const subArray = newSubCats
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createCatalog(newMainCat, subArray);
      setNewMainCat("");
      setNewSubCats("");
      loadCatalogs(); // 再読込
    } catch (error) {
      console.error("Create catalog error:", error);
    }
  };

  // 編集モーダルを開く
  const openEditModal = (cat) => {
    setEditDocId(cat.id);
    setEditMainCat(cat.mainCategory);
    setEditSubCats(cat.subCategories.join(", "));
    setShowEditModal(true);
  };

  // 編集内容保存
  const handleEditSave = async () => {
    if (!editMainCat) return;
    const subArray = editSubCats
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await updateCatalog(editDocId, editMainCat, subArray);
      setShowEditModal(false);
      setEditDocId(null);
      loadCatalogs();
    } catch (error) {
      console.error("Update catalog error:", error);
    }
  };

  // 削除
  const handleDelete = async (docId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      await deleteCatalog(docId);
      loadCatalogs();
    } catch (error) {
      console.error("Delete catalog error:", error);
    }
  };

  // 閉じるボタンを押したら、onClose()を呼んで親に通知
  const handleClose = () => {
    onClose && onClose();
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-3">カテゴリ管理 (全ユーザ共通)</h2>
      <button
        onClick={handleClose}
        className="mb-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
      >
        閉じる
      </button>

      {/* 新規作成フォーム */}
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <h3 className="text-lg font-semibold mb-2">新しいカテゴリを作成</h3>
        <div className="mb-2">
          <label className="block text-sm text-gray-300 mb-1">メインカテゴリ</label>
          <input
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
            value={newMainCat}
            onChange={(e) => setNewMainCat(e.target.value)}
            placeholder="例: 掃除"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm text-gray-300 mb-1">
            サブカテゴリ (カンマ区切り)
          </label>
          <input
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
            value={newSubCats}
            onChange={(e) => setNewSubCats(e.target.value)}
            placeholder="例: リビング, キッチン, トイレ"
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
          onClick={handleCreate}
        >
          追加
        </button>
      </div>

      {/* 一覧表示 */}
      <div className="space-y-4">
        {catalogs.map((cat) => (
          <div
            key={cat.id}
            className="bg-gray-800 p-4 rounded-md flex items-start justify-between"
          >
            <div>
              <p className="font-semibold text-gray-100">
                {cat.mainCategory}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                サブカテゴリ: {cat.subCategories.join(", ")}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 rounded"
                onClick={() => openEditModal(cat)}
              >
                編集
              </button>
              <button
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded"
                onClick={() => handleDelete(cat.id)}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 編集モーダル */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-gray-800 w-full max-w-md p-6 rounded-md">
            <h3 className="text-lg font-semibold mb-2">カテゴリを編集</h3>
            <div className="mb-2">
              <label className="block text-sm text-gray-300 mb-1">
                メインカテゴリ
              </label>
              <input
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={editMainCat}
                onChange={(e) => setEditMainCat(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-300 mb-1">
                サブカテゴリ (カンマ区切り)
              </label>
              <input
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={editSubCats}
                onChange={(e) => setEditSubCats(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
                onClick={handleEditSave}
              >
                保存
              </button>
              <button
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md"
                onClick={() => setShowEditModal(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
