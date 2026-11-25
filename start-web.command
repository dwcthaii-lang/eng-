#!/bin/bash
# Bấm đúp để chạy English Reflex trên macOS
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "[!] Máy chưa cài Node.js. Hãy tải bản LTS tại https://nodejs.org rồi bấm lại file này."
  open "https://nodejs.org"
  read -n 1 -s -r -p "Nhấn phím bất kỳ để đóng..."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Lần đầu chạy: đang cài đặt thư viện, vui lòng đợi 1-2 phút..."
  npm install || { echo "[!] Cài đặt thất bại. Kiểm tra mạng rồi thử lại."; read -n 1 -s -r; exit 1; }
fi
echo "Đang khởi động English Reflex... Trình duyệt sẽ tự mở http://localhost:5173"
echo "(Giữ cửa sổ này mở trong lúc học. Đóng cửa sổ = tắt web.)"
npm start
