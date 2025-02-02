// 請使用 readline 模組實作一個簡單的問答程式，讓使用者輸入名字，並且輸出歡迎訊息。

import readline from 'readline' // 從 Node.js 標準庫導入 readline 模組

// 創建 readline 接口，設置輸入和輸出流
let rl = readline.createInterface({
  input: process.stdin,  // 設置輸入為標準輸入（例如，終端）
  output: process.stdout, // 設置輸出為標準輸出（例如，終端）
})

// 提示用戶輸入名字
rl.question('請輸入你的名字: ', name => {
  // 當用戶輸入後，顯示個性化問候消息
  console.log(`你好, ${name}!`)
  // 關閉 readline 接口，釋放資源
  rl.close()
})