# Math Exam B6 - Chuyển Word sang Web

Dự án này giúp biến các file đề thi Toán (.docx) thành trang web ôn tập trực tuyến một cách nhanh chóng.

## 🚀 Tính năng
- Tự động nhận diện câu hỏi Toán học.
- Nhận diện đáp án đúng thông qua định dạng **Gạch chân** trong file Word.
- Giao diện Glassmorphism hiện đại, mượt mà.
- Tích hợp Firebase để lưu trữ đề thi và mã phòng.
- Hiệu ứng pháo hoa khi hoàn thành bài thi.

## 🛠 Cài đặt & Chạy
1. **Cấu hình Firebase**: 
   - Mở file `src/firebase.ts`.
   - Thay thế các thông tin trong `firebaseConfig` bằng thông số từ [Firebase Console](https://console.firebase.google.com/) của bạn.
2. **Cài đặt thư viện**:
   ```bash
   npm install
   ```
3. **Chạy dự án**:
   ```bash
   npm run dev
   ```
4. **Truy cập**: Mở trình duyệt vào địa chỉ `http://localhost:5173`.

## 📝 Quy tắc chuẩn file Word
- Câu hỏi bắt đầu bằng: **Câu 1.**, **Câu 2.**...
- Đáp án bắt đầu bằng: **A.**, **B.**, **C.**, **D.**
- **QUAN TRỌNG**: Đáp án đúng phải được **Gạch chân (Underline)**.
- Lời giải (không bắt buộc): Bắt đầu bằng **Lời giải:** hoặc **Hướng dẫn:**.
