# 📊 Hướng Dẫn Sử Dụng Import/Export Excel

## ✨ Tính Năng Mới

Ứng dụng học từ vựng của bạn hiện đã hỗ trợ **Import và Export file Excel** (.xlsx, .xls) để quản lý từ vựng dễ dàng hơn!

---

## 🚀 Cách Sử Dụng

### 1️⃣ **Mở Modal Import/Export**

- Trên trang chính, nhấn vào nút **"📊 Excel"** (màu xanh lá) ở thanh công cụ
- Modal Import/Export sẽ hiện ra với 3 tùy chọn chính

---

### 2️⃣ **Export Từ Vựng Ra Excel**

**Bước 1:** Nhấn nút **"📥 Export ... words"**

**Kết quả:** 
- File Excel sẽ được tải xuống tự động
- Tên file: `[tên_bộ_từ]_[ngày_tháng].xlsx`
- Ví dụ: `IELTS_Vocabulary_2026-01-08.xlsx`

**Nội dung file Excel:**
- Bảng tính với 16 cột đầy đủ thông tin:
  - STT
  - Term (Từ)
  - Phonetic (Phiên âm)
  - Type (Loại từ)
  - Definition (Nghĩa)
  - Example (Ví dụ)
  - Example Definition (Nghĩa ví dụ)
  - Synonym (Từ đồng nghĩa)
  - Antonym (Từ trái nghĩa)
  - Collocation (Kết hợp từ)
  - Note (Ghi chú)
  - Level (Cấp độ)
  - Topic (Chủ đề)
  - Image URL
  - SRS Stage
  - Starred

---

### 3️⃣ **Tải Template Mẫu**

**Bước 1:** Nhấn nút **"📋 Download Template"**

**Kết quả:**
- File `vocabulary_template.xlsx` sẽ được tải xuống
- File chứa 2 từ mẫu để bạn tham khảo định dạng

**Lợi ích:**
- Xem đúng cấu trúc cột
- Copy/paste để tạo file của riêng bạn
- Tránh lỗi khi import

---

### 4️⃣ **Import Từ Vựng Từ Excel**

**Bước 1:** Chuẩn bị file Excel
- Sử dụng template đã tải hoặc tạo file mới
- **Bắt buộc:** Phải có cột `Term (Từ)` và `Definition (Nghĩa)`
- Các cột khác có thể để trống

**Bước 2:** Nhấn nút **"📤 Choose Excel File"**

**Bước 3:** Chọn file Excel từ máy tính

**Kết quả:**
- Hệ thống sẽ đọc và import tự động
- Thông báo số lượng từ đã import thành công
- Từ vựng mới sẽ xuất hiện trong danh sách

---

## 📝 Định Dạng File Excel

### ✅ **Cột Bắt Buộc:**
1. **Term (Từ)** - Từ tiếng Anh
2. **Definition (Nghĩa)** - Nghĩa tiếng Việt

### 📌 **Cột Tùy Chọn:**
- Phonetic (Phiên âm): `/ˈæp.əl/`
- Type (Loại từ): `noun`, `verb`, `adjective`, etc.
- Level (Cấp độ): `A1`, `A2`, `B1`, `B2`, `C1`, `C2`
- Topic (Chủ đề): `food`, `travel`, `business`, etc.
- Example (Ví dụ): Câu ví dụ tiếng Anh
- Example Definition: Nghĩa của câu ví dụ
- Synonym: Từ đồng nghĩa (cách nhau bởi dấu phẩy)
- Antonym: Từ trái nghĩa
- Collocation: Cụm từ kết hợp
- Note: Ghi chú học tập
- Image URL: Link ảnh minh họa

---

## 🎯 **Ví Dụ Thực Tế**

### File Excel Mẫu:

| STT | Term (Từ) | Phonetic | Type | Definition | Example | Level | Topic |
|-----|-----------|----------|------|------------|---------|-------|-------|
| 1 | apple | /ˈæp.əl/ | noun | quả táo | I eat an apple every day. | A1 | food |
| 2 | beautiful | /ˈbjuː.tɪ.fəl/ | adjective | đẹp | She is a beautiful girl. | A2 | appearance |
| 3 | accomplish | /əˈkʌm.plɪʃ/ | verb | hoàn thành | We accomplished our goal. | B2 | work |

---

## 💡 **Mẹo Sử Dụng**

### ✨ **Backup Dữ Liệu:**
- Export toàn bộ từ vựng định kỳ (hàng tuần/tháng)
- Lưu file Excel vào Google Drive hoặc OneDrive
- Có thể khôi phục dữ liệu bất cứ lúc nào

### 📚 **Chia Sẻ Bộ Từ:**
- Export bộ từ của bạn
- Gửi file Excel cho bạn bè
- Họ có thể import vào tài khoản của mình

### 🔄 **Chỉnh Sửa Hàng Loạt:**
- Export ra Excel
- Sử dụng Excel để chỉnh sửa nhiều từ cùng lúc
- Import lại để cập nhật

### 📊 **Quản Lý Offline:**
- Export để xem từ vựng khi không có mạng
- Sử dụng Excel để phân tích tiến độ học
- In ra giấy nếu cần

---

## ⚠️ **Lưu Ý Quan Trọng**

1. **Định dạng file:** Chỉ hỗ trợ `.xlsx` và `.xls`
2. **Encoding:** Đảm bảo file Excel sử dụng UTF-8 để hiển thị đúng tiếng Việt
3. **Dữ liệu trùng lặp:** Khi import, từ mới sẽ được thêm vào (không ghi đè)
4. **Kích thước file:** Nên giới hạn dưới 1000 từ mỗi lần import
5. **Tên cột:** Hệ thống hỗ trợ cả tên tiếng Việt và tiếng Anh

---

## 🐛 **Xử Lý Lỗi**

### ❌ **"No valid words found"**
- **Nguyên nhân:** Thiếu cột `Term` hoặc `Definition`
- **Giải pháp:** Kiểm tra lại tên cột và đảm bảo có dữ liệu

### ❌ **"Failed to parse Excel file"**
- **Nguyên nhân:** File bị lỗi hoặc không đúng định dạng
- **Giải pháp:** Tải template mới và copy dữ liệu vào

### ❌ **Tiếng Việt hiển thị lỗi**
- **Nguyên nhân:** Encoding không đúng
- **Giải pháp:** Lưu file Excel với encoding UTF-8

---

## 🎉 **Kết Luận**

Chức năng Import/Export Excel giúp bạn:
- ✅ Quản lý từ vựng dễ dàng hơn
- ✅ Backup và khôi phục dữ liệu
- ✅ Chia sẻ bộ từ với người khác
- ✅ Chỉnh sửa hàng loạt nhanh chóng
- ✅ Làm việc offline với Excel

**Chúc bạn học tốt! 🚀**
