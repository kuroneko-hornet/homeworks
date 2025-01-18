// src/auth.js
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  // Googleログイン用のプロバイダ
  const provider = new GoogleAuthProvider();
  
  /**
   * Googleログイン
   * - ポップアップで認証画面が開きます
   */
  export const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken; // 必要があればトークン取得
      return result.user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };
  
  /**
   * ログアウト
   */
  export const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  /**
   * ログイン状態を監視
   * - userが変わったらcallbackを呼び出します
   */
  export const onAuthChanged = (callback) => {
    return onAuthStateChanged(auth, callback);
  };
  