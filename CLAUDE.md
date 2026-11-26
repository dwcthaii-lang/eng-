# English Reflex – quy tắc dự án

App luyện Nghe & Nói tiếng Anh (React + Vite + Tailwind + PWA), dữ liệu lưu LocalStorage, đăng tự động lên GitHub Pages khi push nhánh `main`.

## QUY TẮC BẮT BUỘC (yêu cầu của người dùng)
**Mọi bài học / loại bài học mới phải được đưa vào ôn tập lặp lại ngắt quãng (SRS).** Không bao giờ thêm nội dung học mà không có lịch ôn, nếu không người học sẽ quên.

Khi thêm một loại bài học mới:
1. Từ/cụm từ trong bài → đưa vào kho từ bằng `seedVocab()` và ghi kết quả nói bằng `recordSpoken()` (`src/lib/srs.js`).
2. Bản thân bài học → gọi `scheduleReview(type, id, grade0to5, title)` khi học xong (`src/lib/review.js`), thêm `type` vào `REVIEW_TYPES` kèm đường dẫn ôn.
3. Bài đến hạn phải hiện ở trang **Ôn tập hôm nay** (`src/modules/Review.jsx`) và trong số đếm nhắc ôn.
4. Ưu tiên ôn trước học mới; giới hạn số bài mới mỗi ngày.

## Quy ước khác
- Giao diện và nội dung giải thích bằng tiếng Việt; nội dung học bằng tiếng Anh tự nhiên.
- 80% trọng tâm là Nghe & Nói phản xạ: ưu tiên bài tập bắt người học NÓI (giữ Space / nút mic).
- Giữ nguyên các phần đã có khi thêm tính năng mới.
- Responsive (thanh điều hướng dưới trên điện thoại), có phím tắt.
