# YouTube Subscription Dashboard

把你的 YouTube 訂閱清單變成一個可搜尋、可排序的靜態 Dashboard。

資料由 Python 腳本透過 YouTube Data API v3 抓取，存成 JSON 後由 React 前端渲染。GitHub Actions 每週自動更新資料。

## 架構

```
YouTube Data API
      ↓
scripts/fetch_subscriptions.py   ← 每週由 GitHub Actions 執行
      ↓
public/data/subscriptions.json   ← 靜態資料檔，commit 進 repo
      ↓
React 前端 (Vite + Tailwind CSS)  ← 讀取 JSON，無任何 API 呼叫
```

## 第一次設定

### 1. 取得 YouTube OAuth 憑證

前往 [Google Cloud Console](https://console.cloud.google.com/)：

1. 建立專案 → 啟用 **YouTube Data API v3**
2. 建立 **OAuth 2.0 用戶端 ID**（應用程式類型：桌面應用程式）
3. 下載 `client_secret.json`，放到專案根目錄

### 2. 取得 Refresh Token（只需做一次）

```bash
pip install -r scripts/requirements.txt
python scripts/get_refresh_token.py
```

瀏覽器會開啟 Google 授權頁面，同意後終端機會印出三個值。

### 3. 設定 GitHub Secrets

到 **Settings → Secrets and variables → Actions**，新增以下三個 Secrets：

| Secret | 說明 |
|---|---|
| `YOUTUBE_CLIENT_ID` | OAuth 2.0 用戶端 ID |
| `YOUTUBE_CLIENT_SECRET` | OAuth 2.0 用戶端密鑰 |
| `YOUTUBE_REFRESH_TOKEN` | 上一步取得的 Refresh Token |

> ⚠️ `client_secret.json` 已加入 `.gitignore`，請勿 commit 進 repo。

### 4. 產生初始資料

到 **Actions → Fetch YouTube Subscriptions → Run workflow**，手動觸發一次。  
執行完後 GitHub Actions 會自動 commit `public/data/subscriptions.json`。

```bash
git pull  # 把產生的資料拉下來
```

### 5. 啟動前端

```bash
npm install
npm run dev
```

開啟 [http://localhost:5173](http://localhost:5173) 即可看到 Dashboard。

## 日常使用

資料每週一 02:00 UTC 自動更新。也可以隨時到 Actions 頁面手動觸發。

## 指令

```bash
npm run dev      # 開發伺服器
npm run build    # 正式打包
npm run lint     # Lint 檢查
npm run preview  # 預覽打包結果
```

## 隱私提醒

`public/data/subscriptions.json` 會記錄你的訂閱清單並 commit 進 repo。  
若不希望訂閱清單公開，請將此 repo 設為 **Private**。

