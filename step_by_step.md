以下の手順は、Firebase の無料枠と PWA 化を利用して、ルームシェアの家事管理アプリケーションを構築する方法を示します。**React** を例にしていますが、Vue や Angular など他のフレームワークでも手順はほぼ同様です。ぜひ参考にしてみてください。

---

## 全体の流れ

1. **環境構築**  
   - Node.js / npm のインストール  
   - Firebase CLI のインストール  

2. **Firebase プロジェクトの作成**  
   - Firebase コンソールで新規プロジェクト作成  
   - Authentication, Cloud Firestore(もしくは Realtime Database), Hosting の設定  

3. **フロントエンドの PWA アプリ開発**  
   - create-react-app（または他のフレームワーク）でアプリを作成  
   - Firebase SDK のインストール・初期化  
   - ユーザー認証ロジックの実装 (Email/Password など)  
   - Firestore で家事情報を管理するための CRUD 処理実装  
   - Manifest ファイルと service worker の設定を確認して PWA 化  

4. **Firebase Hosting へのデプロイ**  
   - Firebase CLI でログイン・初期設定  
   - `firebase deploy` で本番デプロイ  

5. **無料枠を維持するためのポイント**  
   - 無闇にデータを増やさず、データ設計を十分に考慮  
   - Cloud Functions は使わない、または最小限で済むように工夫  
   - 1GB の転送量 / 月を超えないようにリソースを最適化  

---

## Step by Step

### Step 1: 環境構築

1. **Node.js / npm のインストール**  
   - [Node.js 公式サイト](https://nodejs.org/ja) から LTS バージョンをダウンロードしてインストールします。  
   - インストール後、以下のコマンドでバージョンが表示されることを確認してください。  
     ```bash
     node -v
     npm -v
     ```

2. **Firebase CLI のインストール**  
   - グローバルに Firebase CLI をインストールします。  
     ```bash
     npm install -g firebase-tools
     ```
   - インストール後、以下のコマンドでバージョンの確認とログインを行います。  
     ```bash
     firebase --version
     firebase login
     ```

### Step 2: Firebase プロジェクトの作成

1. **Firebase コンソールにアクセス**  
   - [Firebase console](https://console.firebase.google.com/) にアクセスし、新規プロジェクトを作成します。  
   - プロジェクト名・Google Analytics 設定などを入力して進めてください。

2. **Authentication の設定**  
   - Firebase コンソールの左メニュー「Build」>「Authentication」>「ログイン方法」から Email/Password や Google など、使いたいログイン方法を有効にします。  
   - 例: 「Email/Password」を有効にする。

3. **Cloud Firestore(または Realtime Database) の有効化**  
   - 「Build」>「Firestore Database」から「データベースを作成」を押下し、試験運用モードか本番モードを選びます（開発段階では試験運用モードでも可）。  
   - ※「Realtime Database」を使う場合も同様に有効化します。

4. **Hosting の設定（後ほど行う）**  
   - 「Build」>「Hosting」から「始める」をクリックし、後ほどデプロイできるようにしておきます。

### Step 3: フロントエンドの PWA アプリ開発

#### 3-1: React アプリの作成

1. **React アプリ作成**  
   - 下記コマンドで新規 React アプリを作成します。  
     ```bash
     npx create-react-app housekeeping-app
     cd housekeeping-app
     ```
   - 作成後、下記コマンドでローカルサーバを起動できます。  
     ```bash
     npm start
     ```
   - ブラウザで `http://localhost:3000` を開き、React の初期画面が表示されるか確認します。

2. **PWA 化の確認**  
   - create-react-app では、`public/manifest.json` と `src/service-worker.js`（バージョンによっては `src/serviceWorker.js` など）が生成され、基本的な PWA 機能が備わっています。  
   - `manifest.json` にはアプリアイコンやアプリ名などを記述しており、スマホで「ホーム画面に追加」した際のアイコンや名称を設定します。必要に応じて修正します。

#### 3-2: Firebase SDK のインストール・初期化

1. **Firebase SDK のインストール**  
   ```bash
   npm install firebase
   ```
2. **Firebase 設定ファイルの作成**  
   - Firebase コンソールの「プロジェクトの概要」>「アプリを追加」>「ウェブアプリ」を選択し、Firebase SDK スニペットをコピーします。  
   - React プロジェクト内に `src/firebase.js` を作成し、下記のように設定を貼り付けてください。
     ```js
     // src/firebase.js
     import { initializeApp } from "firebase/app";
     import { getAuth } from "firebase/auth";
     import { getFirestore } from "firebase/firestore";

     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID",
     };

     const app = initializeApp(firebaseConfig);

     export const auth = getAuth(app);
     export const db = getFirestore(app);
     ```
   - `.env.local` などを作成し、`apiKey` などの秘密情報を隠す実装も推奨します。

#### 3-3: ユーザー認証の実装

1. **Authentication（Email/Password）の場合**  
   - 例として、サインアップ・ログイン・ログアウトのフローを簡単に書きます。
     ```js
     // src/auth.js (例)
     import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
     import { auth } from "./firebase";

     // 新規ユーザー登録
     export const signUp = async (email, password) => {
       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     };

     // ログイン
     export const login = async (email, password) => {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     };

     // ログアウト
     export const logout = async () => {
       await signOut(auth);
     };
     ```
   - UI 側でフォームを用意して、メールアドレスとパスワードを入力して呼び出す形にします。

2. **ユーザー状態の監視**  
   - 現在ログインしているユーザーを常に取得したい場合、`onAuthStateChanged(auth, callback)` を使います。
     ```js
     // App.js (例)
     import React, { useEffect, useState } from "react";
     import { onAuthStateChanged } from "firebase/auth";
     import { auth } from "./firebase";

     function App() {
       const [currentUser, setCurrentUser] = useState(null);

       useEffect(() => {
         const unsubscribe = onAuthStateChanged(auth, (user) => {
           setCurrentUser(user);
         });
         return () => unsubscribe();
       }, []);

       return (
         <div>
           {currentUser ? (
             <p>ログイン中: {currentUser.email}</p>
           ) : (
             <p>ログアウト中</p>
           )}
         </div>
       );
     }

     export default App;
     ```

#### 3-4: 家事管理のデータ構造（Firestore）の実装

1. **データ構造のイメージ**  
   - たとえば下記のようなコレクションとフィールドを想定:
     ```
     chores (コレクション)
       └ docId
         ├ title: "部屋の掃除"
         ├ description: "週に1回やる"
         ├ assignedTo: "ユーザーID"
         ├ dueDate: 1672531200 (unix timestamp)
         └ status: "TODO" | "DONE" ...
     ```
   - ルームメイト全員が共有する家事データを作る場合は、ユーザーごとの参照設計なども考慮します。

2. **Firestore への書き込み・読み込み**  
   - 例として、新規家事タスクを追加する場合のコード例:
     ```js
     // src/db.js (例)
     import { db } from "./firebase";
     import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

     // 新規タスク追加
     export const addChore = async (title, description, assignedTo, dueDate) => {
       const choresRef = collection(db, "chores");
       await addDoc(choresRef, {
         title,
         description,
         assignedTo,
         dueDate,
         status: "TODO",
         createdAt: new Date(),
       });
     };

     // タスク一覧取得
     export const fetchChores = async () => {
       const choresRef = collection(db, "chores");
       const snapshot = await getDocs(choresRef);
       return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     };

     // タスク更新（例：ステータス変更）
     export const updateChoreStatus = async (choreId, status) => {
       const choreDoc = doc(db, "chores", choreId);
       await updateDoc(choreDoc, { status });
     };
     ```
   - UI 側でボタンやフォームからこれらの関数を呼び出す形にし、ルームメイト全員が共有できるように設計します。

#### 3-5: PWA 化の最終調整

1. **manifest.json の編集**  
   - `public/manifest.json` にアプリアイコン（`src/assets/icon.png` など）を指定し、`"short_name"` や `"name"`, `"theme_color"`, `"background_color"` を変更します。  
   - 例:  
     ```json
     {
       "short_name": "ルーム家事管理",
       "name": "ルームシェア家事管理アプリ",
       "icons": [
         {
           "src": "icon-192.png",
           "type": "image/png",
           "sizes": "192x192"
         },
         {
           "src": "icon-512.png",
           "type": "image/png",
           "sizes": "512x512"
         }
       ],
       "start_url": ".",
       "display": "standalone",
       "theme_color": "#ffffff",
       "background_color": "#ffffff"
     }
     ```

2. **service worker の確認**  
   - create-react-app の場合、ビルド時に `src/service-worker.js` が自動的に登録されます（バージョンによっては `serviceWorkerRegistration.js` など別ファイル）。  
   - 開発用サーバでは有効にならないことが多いので、本番ビルド＆デプロイ後に PWA として機能するかを確認します。

3. **オフライン動作テスト**  
   - デプロイ後、Chrome デベロッパーツール > Lighthouse などで PWA としての指標を確認すると良いです。

---

### Step 4: Firebase Hosting へのデプロイ

1. **Firebase Hosting の初期化**  
   - React プロジェクトのルートディレクトリ（`housekeeping-app`）で以下を実行します。  
     ```bash
     firebase init
     ```
   - 「Hosting」を選択、既存プロジェクトを選んで先ほど作成した Firebase プロジェクトを指定します。  
   - `build` フォルダを公開ディレクトリとして設定します。

2. **ビルド & デプロイ**  
   - React アプリを本番用にビルドします。  
     ```bash
     npm run build
     ```
   - ビルド完了後、以下でデプロイします。  
     ```bash
     firebase deploy
     ```
   - コンソールに表示される Hosting URL にアクセスし、アプリが問題なく動作するか確認してください。

---

## Step 5: 無料枠を維持するためのポイント

1. **Firestore や Hosting の無料枠**  
   - Firestore は 1GB ストレージ・月 5万回読み取りなどの無料枠があります。  
   - Hosting は 1GB / 月のデータ転送量が無料枠です。  
   - 画像や動画など大きなファイルを取り扱う場合は注意が必要です。

2. **Cloud Functions の利用**  
   - 無料枠内でも 1 カ月 200 万回までの呼び出しが可能ですが、複雑な処理を多用するとすぐに枠を超えてしまう可能性があります。  
   - どうしても Functions が必要でない限り、フロントエンドと Firestore の組み合わせのみで完結させましょう。

3. **セキュリティルールの設定**  
   - 本番運用する場合は、Firestore のセキュリティルールでユーザーごとに読み書きを制限する必要があります。  
   - ルールの例:
     ```js
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /chores/{choreId} {
           allow read, update, delete: if request.auth != null; // ログインユーザーのみ
           allow create: if request.auth != null;
         }
       }
     }
     ```

---

## まとめ

- **React + Firebase** を使えば、無料枠の範囲内でルームシェアの家事管理アプリを十分に構築できます。  
- **認証**・**DB**・**ホスティング**・**PWA 化** を最低限押さえれば、スマホアプリのような操作感を実現できます。  
- デプロイ後、**「ホーム画面に追加」** を行うことでネイティブアプリに近い使い心地になるので、ルームメイトとの共同作業がスムーズになります。  

上記の手順に従うことで、誰でも Firebase の無料枠で PWA アプリを作成できます。必要に応じてデザインをカスタマイズしたり、通知機能を追加したりして充実したアプリに仕上げてみてください。ぜひ開発を楽しんでくださいね。