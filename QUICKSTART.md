# 🚀 VocabMaster Pro - Complete Guide

## 🌟 Tổng quan

VocabMaster Pro là ứng dụng học từ vựng toàn diện với 6 chế độ học tập khác nhau, được thiết kế dựa trên phương pháp học Quizlet và các nguyên lý khoa học về ghi nhớ.

**Ứng dụng đang chạy tại:** http://localhost:5173

---

## 📚 Quản lý Sets (Bộ từ vựng)

### Tạo và quản lý Sets
- **Tạo Set mới**: Click vào dropdown "Current Set" → "➕ Create New Set"
- **Chuyển đổi giữa các Sets**: Click vào dropdown và chọn set bạn muốn
- **Xóa Set**: Click icon 🗑️ bên cạnh tên set (không thể xóa set cuối cùng)

### Lợi ích của Sets
- Tổ chức từ vựng theo chủ đề (IELTS, TOEIC, Business English, etc.)
- Học riêng biệt từng nhóm từ
- Theo dõi tiến độ cho từng bộ từ

---

## ➕ Thêm từ vựng

### 1. Thêm từ đơn lẻ
- Click **"➕ Add Word"**
- Điền thông tin:
  - **Term** (Từ vựng) - Bắt buộc
  - **Definition** (Nghĩa) - Bắt buộc
  - **Phonetic** (Phiên âm) - Tùy chọn
  - **Type** (Loại từ) - Tùy chọn
  - **Example** (Ví dụ) - Tùy chọn
  - **Image URL** (Hình ảnh) - Tùy chọn

### 2. Import hàng loạt
- Click **"📥 Import"**
- Chọn một trong hai cách:

#### 📄 Upload File
- Tải file `.txt` với định dạng:
```
word | phonetic | definition | type
```

**Ví dụ:**
```
serendipity | /ˌserənˈdɪpɪti/ | the occurrence of events by chance | noun
eloquent | /ˈeləkwənt/ | fluent or persuasive in speaking | adjective
```

#### 📝 Paste Text
- Dán danh sách từ vào ô text
- Hỗ trợ nhiều định dạng:
  - `word | phonetic | definition | type`
  - `word - definition`
  - `word: definition`

---

## 🎓 CÁC CHẾ ĐỘ HỌC TẬP

### 1. 🎴 Flashcards (Thẻ ghi nhớ)

**Tính năng:**
- ✅ Lật thẻ bằng click hoặc phím Space/Enter
- ✅ Audio phát âm (Text-to-Speech)
- ✅ Đánh dấu Star cho từ khó
- ✅ Shuffle (xáo trộn thẻ)
- ✅ Học 2 chiều (EN → VI hoặc VI → EN)
- ✅ Chỉ học từ đã Star

**Cách sử dụng:**
1. Click **"🎴 Flashcards"**
2. Sử dụng các nút điều khiển:
   - **🔀 Shuffle**: Xáo trộn thứ tự thẻ
   - **🔄 EN → VI**: Đổi chiều học (Anh → Việt hoặc Việt → Anh)
   - **⭐ Starred Only**: Chỉ học từ đã đánh dấu sao
   - **🔊 Speak**: Phát âm từ hiện tại
3. Click thẻ hoặc nhấn Space để lật
4. Dùng mũi tên ← → hoặc nút Previous/Next để di chuyển

**Phím tắt:**
- `Space` / `Enter`: Lật thẻ
- `←`: Thẻ trước
- `→`: Thẻ tiếp theo

---

### 2. 🎓 Learn (Học thông minh)

**Tính năng:**
- ✅ Hệ thống Spaced Repetition (lặp lại ngắt quãng)
- ✅ Câu hỏi tự động đa dạng (trắc nghiệm, điền từ)
- ✅ Từ sai xuất hiện lại nhiều hơn
- ✅ Theo dõi mức độ thành thạo (Mastery Level 0-5)

**Cách hoạt động:**
- Mỗi từ có **Mastery Level** từ 0-5
- Trả lời đúng → tăng level → xuất hiện ít hơn
- Trả lời sai → giảm level → xuất hiện nhiều hơn
- Hệ thống tự động lên lịch ôn tập: 1, 3, 7, 14, 30, 60 ngày

**Cách sử dụng:**
1. Click **"🎓 Learn"**
2. Đọc câu hỏi và chọn đáp án
3. Nhận phản hồi ngay lập tức
4. Tiếp tục cho đến khi hoàn thành

---

### 3. ✍️ Write (Viết từ)

**Tính năng:**
- ✅ Hiển thị nghĩa → gõ từ tiếng Anh
- ✅ Kiểm tra chính tả chính xác
- ✅ Cho phép thử lại nếu sai
- ✅ Theo dõi điểm số

**Cách sử dụng:**
1. Click **"✍️ Write"**
2. Đọc nghĩa tiếng Việt
3. Gõ từ tiếng Anh tương ứng
4. Nhấn Enter hoặc "Check Answer"
5. Nếu sai, có thể "Try Again" hoặc "Next"

**Lợi ích:**
- Rèn luyện khả năng viết chính xác
- Ghi nhớ chính tả tốt hơn
- Phát triển kỹ năng recall (nhớ lại chủ động)

---

### 4. 🔊 Spell (Nghe và đánh vần)

**Tính năng:**
- ✅ Nghe audio → gõ lại từ
- ✅ Text-to-Speech tự động
- ✅ Hiển thị hint (nghĩa) để hỗ trợ
- ✅ Có thể nghe lại nhiều lần

**Cách sử dụng:**
1. Click **"🔊 Spell"**
2. Click nút 🔊 lớn để nghe từ
3. Đọc hint (nghĩa) nếu cần
4. Gõ từ bạn nghe được
5. Nhấn Enter hoặc "Check Spelling"

**Lợi ích:**
- Luyện nghe và phát âm
- Cải thiện khả năng đánh vần
- Kết hợp kỹ năng listening và writing

---

### 5. 🎮 Match (Ghép cặp)

**Tính năng:**
- ✅ Ghép từ với nghĩa
- ✅ Tính giờ (timer)
- ✅ Tối đa 6 cặp mỗi lần chơi
- ✅ Hiệu ứng trực quan khi ghép đúng/sai

**Cách sử dụng:**
1. Click **"🎮 Match"** (cần ít nhất 2 từ)
2. Click vào một thẻ (từ hoặc nghĩa)
3. Click vào thẻ thứ hai để ghép cặp
4. Nếu đúng → thẻ biến mất
5. Nếu sai → thẻ quay lại
6. Hoàn thành tất cả để xem thời gian

**Lợi ích:**
- Học nhanh và vui
- Tạo động lực cạnh tranh
- Cải thiện tốc độ nhận diện từ

---

### 6. 📝 Test (Kiểm tra)

**Tính năng:**
- ✅ Tự động tạo câu hỏi trắc nghiệm
- ✅ 4 đáp án cho mỗi câu
- ✅ Xem kết quả ngay lập tức
- ✅ Thống kê chi tiết cuối bài

**Cách sử dụng:**
1. Click **"📝 Test"** (cần ít nhất 4 từ)
2. Đọc câu hỏi
3. Chọn đáp án đúng
4. Xem phản hồi ngay
5. Xem tổng kết cuối bài test

---

## ⭐ Tính năng Star (Đánh dấu)

### Cách đánh dấu Star
- Trên thẻ từ vựng: Click nút ⭐/☆
- Trong Flashcards: Click ⭐/☆ góc trên bên phải

### Lợi ích
- Đánh dấu từ khó cần ôn nhiều
- Tạo danh sách từ yêu thích
- Học riêng nhóm từ đã star trong Flashcards

---

## 📊 Thống kê và Theo dõi

### Trên Dashboard
- **Words**: Tổng số từ trong set hiện tại
- **Starred**: Số từ đã đánh dấu sao

### Trên mỗi thẻ từ (mặt sau)
- **Reviewed**: Số lần đã ôn tập
- **Accuracy**: Tỷ lệ trả lời đúng (%)

### Dữ liệu ẩn (cho Spaced Repetition)
- **Mastery Level**: Mức độ thành thạo (0-5)
- **Next Review**: Ngày ôn tập tiếp theo
- **Last Reviewed**: Lần ôn cuối cùng

---

## 🎯 Lộ trình học đề xuất

### Người mới bắt đầu
1. **Import** hoặc thêm từ vào set
2. **Flashcards** - Làm quen với từ mới
3. **Learn** - Học có hệ thống
4. **Write** - Luyện viết
5. **Test** - Kiểm tra kiến thức

### Người học nâng cao
1. **Flashcards** (Starred Only) - Ôn từ khó
2. **Spell** - Luyện nghe và phát âm
3. **Match** - Tăng tốc độ nhận diện
4. **Learn** - Duy trì spaced repetition

---

## 💡 Tips học hiệu quả

### 1. Sử dụng Spaced Repetition
- Học đều đặn mỗi ngày
- Để hệ thống Learn tự động lên lịch
- Ôn lại từ cũ trước khi học từ mới

### 2. Đa dạng phương pháp
- Kết hợp nhiều chế độ học
- Không chỉ học Flashcards
- Thử Write và Spell để ghi nhớ sâu hơn

### 3. Đánh dấu Star thông minh
- Star từ khó, không phải từ dễ
- Ôn riêng nhóm Star thường xuyên
- Bỏ star khi đã thuộc

### 4. Tổ chức Sets hợp lý
- Tạo set theo chủ đề
- Không để quá nhiều từ trong 1 set (50-100 từ/set)
- Tạo set riêng cho từ khó

---

## 🔧 Tính năng kỹ thuật

### Lưu trữ dữ liệu
- Tất cả dữ liệu lưu trong **localStorage** của trình duyệt
- Không cần đăng nhập
- Dữ liệu không mất khi tắt trình duyệt
- **Lưu ý**: Xóa cache trình duyệt sẽ mất dữ liệu

### Text-to-Speech
- Sử dụng Web Speech API
- Phát âm giọng Anh Mỹ
- Hoạt động offline (nếu trình duyệt hỗ trợ)

### Responsive Design
- Hoạt động tốt trên desktop, tablet, mobile
- Tối ưu cho màn hình lớn

---

## 🎨 Giao diện

### Màu sắc
- **Primary**: Gradient xanh dương - tím
- **Success**: Gradient xanh lá
- **Warning**: Gradient vàng - cam
- **Glass Effect**: Hiệu ứng kính mờ hiện đại

### Animations
- Flip 3D cho flashcards
- Hover effects mượt mà
- Transitions mượt mà

---

## ❓ FAQ

**Q: Dữ liệu có bị mất không?**
A: Dữ liệu lưu trong localStorage. Chỉ mất khi xóa cache hoặc dữ liệu trình duyệt.

**Q: Có thể export dữ liệu không?**
A: Hiện tại chưa có tính năng export. Sẽ bổ sung trong phiên bản sau.

**Q: Tại sao không nghe được audio?**
A: Kiểm tra trình duyệt có hỗ trợ Web Speech API không. Chrome, Edge, Safari hỗ trợ tốt.

**Q: Có giới hạn số từ không?**
A: Không giới hạn, nhưng nên giữ mỗi set dưới 100 từ để học hiệu quả.

**Q: Làm sao để học nhanh nhất?**
A: Kết hợp Learn (spaced repetition) + Write + Spell. Học đều đặn 15-30 phút/ngày.

---

## 🚀 Bắt đầu ngay!

1. **Import** file mẫu `sample-vocabulary.txt` để test
2. Thử tất cả 6 chế độ học
3. Tạo set riêng cho chủ đề bạn quan tâm
4. Học đều đặn mỗi ngày

**Chúc bạn học tốt! 📚✨**
