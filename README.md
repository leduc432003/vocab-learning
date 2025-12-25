# 📚 Học từ vựng cùng Đức - Ứng dụng Học Từ Vựng

Ứng dụng web hiện đại giúp bạn học và ghi nhớ từ vựng tiếng Anh một cách hiệu quả, tương tự như Quizlet.

## ✨ Tính năng

### 🎯 Quản lý Từ vựng
- ➕ **Thêm từ mới**: Nhập từ, phiên âm, nghĩa, loại từ và ảnh minh họa
- ✏️ **Chỉnh sửa**: Cập nhật thông tin từ vựng bất kỳ lúc nào
- 🗑️ **Xóa từ**: Loại bỏ từ không cần thiết
- 🔍 **Tìm kiếm**: Tìm kiếm nhanh theo từ hoặc nghĩa

### 📥 Import Hàng loạt
- 📝 **Paste Text**: Dán danh sách từ vựng trực tiếp
- 📄 **Upload File**: Tải file .txt chứa từ vựng
- Hỗ trợ nhiều định dạng:
  - `word | definition`
  - `word | definition | type`
  - `word | phonetic | definition | type`

### 🎓 Chế độ Học
- Flashcard với hiệu ứng lật 3D
- Tự đánh giá mức độ hiểu
- Theo dõi tiến độ học tập
- Thống kê số câu đúng/sai

### 📝 Chế độ Kiểm tra
- Câu hỏi trắc nghiệm 4 đáp án
- Hiển thị kết quả ngay lập tức
- Tính điểm tự động
- Yêu cầu tối thiểu 4 từ để bắt đầu

### 💾 Lưu trữ
- Dữ liệu lưu trữ hoàn toàn trên trình duyệt (LocalStorage)
- Không cần đăng nhập hay kết nối internet
- Dữ liệu được bảo toàn ngay cả khi đóng trình duyệt

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. **Clone hoặc tải project**
```bash
cd English\ Website
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy development server**
```bash
npm run dev
```

4. **Mở trình duyệt**
Truy cập: `http://localhost:5173`

## 🎨 Công nghệ sử dụng

- ⚛️ **React 18**: Framework UI hiện đại
- 🎨 **Tailwind CSS**: Utility-first CSS framework
- ⚡ **Vite**: Build tool siêu nhanh
- 💾 **LocalStorage API**: Lưu trữ dữ liệu local

## 📖 Hướng dẫn sử dụng

### Thêm từ mới
1. Click nút **"➕ Add Word"**
2. Điền thông tin:
   - **Word/Term**: Từ vựng (bắt buộc)
   - **Phonetic**: Phiên âm (tùy chọn)
   - **Definition**: Nghĩa (bắt buộc)
   - **Word Type**: Loại từ (tùy chọn)
   - **Image**: Ảnh minh họa (tùy chọn)
3. Click **"Add Word"**

### Import hàng loạt
1. Click nút **"📥 Import"**
2. Chọn phương thức:
   - **Paste Text**: Dán danh sách từ
   - **Upload File**: Tải file .txt
3. Định dạng mỗi dòng:
   ```
   serendipity | /ˌserənˈdɪpɪti/ | the occurrence of events by chance | noun
   ```
4. Click **"Import Words"**

### Học từ vựng
1. Click nút **"🎓 Learn"**
2. Xem từ và thông tin
3. Click **"Show Answer"** để xem nghĩa
4. Đánh giá: **"✅ Correct"** hoặc **"❌ Incorrect"**
5. Tiếp tục cho đến hết danh sách

### Kiểm tra
1. Click nút **"📝 Test"** (cần ít nhất 4 từ)
2. Đọc từ và chọn nghĩa đúng
3. Click **"Submit Answer"**
4. Xem kết quả và tiếp tục
5. Nhận điểm tổng kết khi hoàn thành

## 🎯 Tính năng nổi bật

### Thiết kế hiện đại
- 🌙 Dark mode mặc định
- 🎨 Gradient màu sắc đẹp mắt
- ✨ Hiệu ứng animation mượt mà
- 📱 Responsive trên mọi thiết bị

### Trải nghiệm người dùng
- 🔄 Flashcard lật 3D
- 📊 Thống kê chi tiết
- ⚡ Tốc độ tải nhanh
- 💫 Micro-animations

## 📁 Cấu trúc Project

```
English Website/
├── src/
│   ├── components/
│   │   ├── VocabCard.jsx       # Card hiển thị từ vựng
│   │   ├── AddWordModal.jsx    # Modal thêm/sửa từ
│   │   ├── ImportModal.jsx     # Modal import
│   │   ├── LearnMode.jsx       # Chế độ học
│   │   └── TestMode.jsx        # Chế độ kiểm tra
│   ├── utils/
│   │   └── localStorage.js     # Quản lý LocalStorage
│   ├── App.jsx                 # Component chính
│   ├── index.css              # Tailwind CSS
│   └── main.jsx               # Entry point
├── tailwind.config.js         # Cấu hình Tailwind
├── postcss.config.js          # Cấu hình PostCSS
└── package.json
```

## 🔧 Build Production

```bash
npm run build
```

File build sẽ được tạo trong thư mục `dist/`

## 📝 Ghi chú

- Dữ liệu được lưu trữ trong LocalStorage của trình duyệt
- Xóa cache trình duyệt sẽ xóa toàn bộ dữ liệu
- Khuyến nghị export dữ liệu định kỳ để backup

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License

---

**Chúc bạn học tập hiệu quả! 🎓✨**
