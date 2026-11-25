# 🎙️ English Reflex – Hướng dẫn chi tiết

Ứng dụng web chạy **hoàn toàn trên máy bạn** (React + Vite + Tailwind). Tiến độ lưu trong trình duyệt (LocalStorage), giọng nói dùng **Web Speech API miễn phí** của Chrome/Edge. Có thể nhập API key Gemini/OpenAI để chấm điểm ngữ nghĩa và tạo hội thoại động.

## 1. Cách chạy trên máy

**Yêu cầu:** Node.js 18 trở lên (tải tại https://nodejs.org, chọn bản LTS) và trình duyệt **Google Chrome** hoặc **Microsoft Edge**.

```bash
# 1. Giải nén file zip, mở Terminal / PowerShell tại thư mục english-reflex
cd english-reflex

# 2. Cài thư viện (chỉ làm 1 lần, mất khoảng 1 phút)
npm install

# 3. Chạy ứng dụng (bản chính thức, có PWA)
npm start

# hoặc chế độ phát triển (sửa code thấy ngay)
npm run dev
```

(Hoặc đơn giản bấm đúp `start-web.bat` / `start-web.command`.)

Trình duyệt sẽ tự mở **http://localhost:5173**. Lần đầu bấm mic, trình duyệt hỏi quyền micro → chọn **Allow / Cho phép**.

> Mỗi lần học chỉ cần chạy lại `npm start` (hoặc bấm file start-web). Dừng bằng `Ctrl + C` trong Terminal.

**Lưu ý quan trọng**
- Nhận diện giọng nói của Chrome/Edge cần **có Internet** (Google/Microsoft xử lý âm thanh). Firefox/Safari hiện không hỗ trợ tốt.
- Nên **đeo tai nghe** khi Shadowing để micro không thu lại tiếng loa.
- Edge có các giọng “Microsoft … Online (Natural)” nghe rất tự nhiên – chọn trong **Cài đặt → Giọng đọc**.
- Dữ liệu gắn với trình duyệt + địa chỉ `localhost:5173`. Vào **Cài đặt → Xuất file sao lưu** mỗi tuần.

## 2. Lộ trình 90 phút/ngày gợi ý

| Phiên | Module | Thời lượng |
|---|---|---|
| 1 | 🗣️ Từ vựng kích hoạt chủ động | 20′ |
| — | nghỉ | 5′ |
| 2 | 🎧 Nghe “cai phụ đề” (1–2 bài) | 25′ |
| — | nghỉ | 5′ |
| 3 | ⏱️ Nhập vai phản xạ (2–3 tình huống) | 30′ |
| 4 | ✍️ Đọc & Viết | 15′ |

Mẹo: học cùng một tình huống xuyên suốt cả 3 module (VD: “Máy giặt hỏng” → nghe bài máy giặt → nhập vai với Jake) để cụm từ được dùng lại nhiều lần.

## 3. Các module

**Module 1 – Từ vựng kích hoạt chủ động:** Thẻ hiển thị tình huống tiếng Việt + ngữ cảnh. Giữ `Space` để nói thành câu hoàn chỉnh. Lần đầu được xem cụm từ gợi ý; khi ôn lại, gợi ý bị ẩn (bấm `H` nếu cần, nhưng lần đó không tính “tự nói”).

**Module 2 – Nghe cai phụ đề (khoá 3 bước):**
1. *Nghe mù:* phải nghe đủ 2 lần, rồi gõ/nói tóm tắt mới mở khoá bước 2.
2. *Điền & nối âm:* transcript hiện ra nhưng che chỗ nối âm/nuốt âm (gonna, didja, lemme…). Kiểm tra xong sẽ có giải thích từng hiện tượng.
3. *Shadowing:* transcript có đánh dấu trọng âm (gạch chân) và ngữ điệu (↗ ↘). Bấm `S`: audio phát và mic ghi âm cùng lúc, chấm % khớp.

**Module 3 – Nhập vai phản xạ:** AI (bạn cùng phòng, giáo sư, kỹ thuật viên phòng sạch…) nói, chữ bị ẩn. Hết lời là đồng hồ đếm ngược 5–8 giây (chỉnh trong Cài đặt) buộc bạn bắt đầu nói. `H` = gợi ý 2–3 từ khoá. Kết thúc: 3 điểm cần sửa (“Câu bạn nói” vs “Tự nhiên hơn”) + từ bị bí vào danh sách **Từ cần kích hoạt lại**. Có API key → thêm chế độ **hội thoại động** do AI sinh.

**Module 4 – Tổng quan & SRS:** Đếm thời gian học thực tế (chỉ tính khi tab đang mở và bạn có thao tác trong 90 giây gần nhất). Từ vựng đi qua 4 trạng thái: **Mới → Đã hiểu khi nghe → Đã bật ra khi nói → Thành thạo**. “Thành thạo” = tự nói đúng cụm từ trong ngữ cảnh, *không xem gợi ý*, ở **3 ngày khác nhau** (lịch ôn 1 → 2 → 4 ngày).

**📅 Ôn tập hôm nay:** gom mọi bài đến hạn theo lịch lặp lại ngắt quãng kiểu SM-2 (1 → 3 → 7 → 15 → 30+ ngày, điều chỉnh theo điểm của bạn). Mỗi ngày giới hạn số thẻ mới (mặc định 6, đổi trong Cài đặt) để luôn còn thời gian ôn. Nhắc ôn: thông báo trình duyệt vào giờ bạn chọn + file lịch .ics.

**📚 Học theo cụm:** mỗi cụm từ có đồng nghĩa, trái nghĩa, từ liên quan và 2 ví dụ văn nói tự nhiên (sẵn cho 120 cụm chính; cụm khác bấm “Mở rộng bằng AI”). Xem sau mỗi thẻ nói hoặc bấm vào dòng trong Kho từ vựng.

**🗃️ Thư viện bài học:** xem trạng thái/lịch ôn của mọi tình huống, tạo tình huống mới bằng AI không giới hạn, nhập/xuất gói bài học.

**🗂️ Lịch sử học:** lưu tới 3000 hoạt động gần nhất, nhóm theo ngày, kèm số phút học.

**Đọc & Viết (15′):**
- *Dịch đoạn văn Việt→Anh:* 20 đoạn theo các tình huống; gợi ý từ từng cái một, ô tra nhanh tiếng Việt→Anh (AI nếu có key), sửa ngữ pháp/chính tả miễn phí bằng LanguageTool, AI gợi ý từ vựng tự nhiên hơn; có lịch ôn.
- *Đọc chủ động:* thông báo KTX và abstract bài báo bán dẫn ngắn; bấm cụm từ vàng để đưa vào kho luyện nói; trả lời 2 câu hỏi thành tiếng.
- *Nhật ký 3–5 câu:* viết nhật ký lab/đời sống bằng cụm từ đang học → (AI sửa nếu có key) → đọc to lại bằng mic. Nhật ký lab chính là bản nháp báo cáo tuần cho giáo sư.
- *Dịch ngược:* đọc câu mẫu → che đi → nhìn tình huống tiếng Việt viết lại tiếng Anh.
- Ngoài app: mỗi ngày đọc 1 abstract trong lĩnh vực của bạn (IEEE EDL, APL…), chép 3 cụm từ vào **Kho từ vựng → Thêm**.

## 4. Phím tắt

| Phím | Chức năng |
|---|---|
| `Space` (giữ) | Nói (thả ra để dừng) |
| `R` | Nghe lại audio / câu mẫu |
| `H` | Gợi ý |
| `Enter` | Thẻ tiếp theo (Module 1) |
| `T` | Hiện/ẩn chữ của AI (Module 3) |
| `S` | Shadow câu đang chọn (Module 2) |
| `Esc` | Thoát ô nhập để dùng lại `Space` |

## 5. AI nâng cao (tuỳ chọn)

Vào **Cài đặt** → chọn Google Gemini (có gói miễn phí, lấy key ở https://aistudio.google.com) hoặc OpenAI → dán key → **Kiểm tra kết nối**. Key chỉ lưu trong trình duyệt của bạn và được gửi thẳng tới Google/OpenAI.

Khi bật AI: Module 1 chấm ngữ nghĩa + đưa câu tự nhiên hơn; Module 2 chấm bản tóm tắt; Module 3 có hội thoại động + AI chọn 3 lỗi quan trọng nhất; Nhật ký được AI sửa.

## 6. Cấu trúc thư mục

```
english-reflex/
├── start-web.bat / start-web.command   # Bấm đúp để chạy
├── README.md · HUONG-DAN-CHI-TIET.md
├── index.html
├── public/                    # PWA: manifest, service worker, icon
├── package.json · vite.config.js · tailwind.config.js · postcss.config.js
└── src/
    ├── main.jsx, App.jsx          # Khung app, điều hướng (#/…), đếm thời gian học
    ├── index.css                  # Tailwind + class dùng chung
    ├── lib/
    │   ├── store.js               # Lưu trữ LocalStorage (settings, vocab, tiến độ, thời gian)
    │   ├── speech.js              # Web Speech API: TTS 2 giọng + hook nhận diện giọng nói
    │   ├── hotkeys.js             # Giữ Space để nói, phím tắt
    │   ├── srs.js                 # Lặp lại ngắt quãng cho kỹ năng Nói (4 trạng thái)
    │   ├── text.js                # Chuẩn hoá, so khớp cụm từ, chấm điểm cục bộ, markup hội thoại
    │   ├── ai.js                  # Gemini / OpenAI (chấm điểm, sinh hội thoại, sửa lỗi)
    │   └── date.js
    ├── data/
    │   ├── dorm.js                # 10 tình huống KTX & đời sống Đài Loan
    │   ├── lab.js                 # 10 tình huống Lab bán dẫn & học thuật
    │   ├── readings.js            # Bài đọc ngắn
    │   └── index.js
    ├── components/                # Mic, UI dùng chung
    └── modules/                   # Dashboard, Recall, Listening, Roleplay, Writing, Vocabulary, Settings
```

Mỗi tình huống trong `data/` gồm: 2 thẻ nói (Module 1), 1 bài nghe có đánh dấu nối âm (Module 2), 1 kịch bản nhập vai 4 lượt (Module 3).

**Tự thêm tình huống:** sao chép một khối trong `src/data/dorm.js` hoặc `lab.js` và sửa nội dung. Cú pháp bài nghe:
- `[[gonna|going to|giải thích]]` → chỗ trống: *dạng nói | đáp án chấp nhận thêm (phẩy) | giải thích nối âm*
- `*word*` → trọng âm câu
