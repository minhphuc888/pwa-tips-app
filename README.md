# Ứng dụng Tra cứu Mẹo vặt Offline (PWA)

Đây là một ứng dụng Web App dạng Single Page Application (SPA) dùng để tra cứu các mẹo vặt hữu ích hàng ngày. Ứng dụng được thiết kế theo kiến trúc Progressive Web App (PWA) cho phép hoạt động hoàn toàn offline và có thể cài đặt trực tiếp lên màn hình chính (Add to Home Screen).

## Tính năng nổi bật

- **Giao diện tối giản, responsive**: Thiết kế hiện đại, hoạt động mượt mà trên mọi thiết bị.
- **Chế độ Sáng/Tối (Light/Dark Mode)**: Dễ dàng chuyển đổi và tự động lưu trạng thái vào `localStorage`.
- **Hoạt động Offline (Cache-first)**: Sử dụng Service Worker để cache tĩnh toàn bộ file (HTML, CSS, JS, JSON) ngay lần load đầu tiên.
- **Lưu trữ bền vững (Persistent Storage)**: Yêu cầu trình duyệt cấp quyền lưu trữ vĩnh viễn (`navigator.storage.persist()`) nhằm tránh bị hệ điều hành xóa data khi bộ nhớ đầy.
- **Tìm kiếm Real-time thông minh**: 
  - Tìm kiếm tức thì ngay khi gõ.
  - Lọc theo tiêu đề hoặc tags.
  - Xử lý chuỗi thông minh: loại bỏ dấu Tiếng Việt, chuyển về in thường để kết quả chính xác nhất.

## Kiến trúc kỹ thuật

- **Front-end Core**: HTML5, CSS3 (Vanilla), JavaScript (ES6+). Không sử dụng Framework phức tạp để tối ưu dung lượng và hiệu suất.
- **Dữ liệu**: Nguồn dữ liệu tĩnh được đặt trong thư mục `data/`. Mỗi mẹo vặt là một file Markdown (`.md`) riêng biệt được sắp xếp theo thư mục chủ đề (ví dụ: `data/quay_chup/photo/cach_chup_dem.md`). Sử dụng `index.json` làm mục lục chứa metadata để tối ưu tìm kiếm.
- **Thư viện phụ trợ**: Sử dụng `marked.js` để render Markdown sang HTML trực tiếp ở phía client.
- **PWA Core**: `manifest.json`, `sw.js` (Service Worker).

## Cấu trúc dự án (Dự kiến)
```text
/
├── index.html        # Giao diện chính của SPA
├── style.css         # Style (UI/UX, Dark mode, Responsive)
├── app.js            # Logic tìm kiếm, điều hướng, theme toggle
├── marked.min.js     # Thư viện parse Markdown (tải về máy để dùng offline)
├── data/             # Thư mục chứa dữ liệu mẹo vặt
│   ├── index.json    # Mục lục chứa metadata (title, tags, file path) để tìm kiếm
│   ├── quay_chup/
│   │   └── photo/
│   │       └── cach_chup_dem.md
│   └── nha_cua/
│       └── ve_sinh/
│           └── tay_vet_ban.md
├── manifest.json     # Cấu hình PWA
└── sw.js             # Service Worker cache tĩnh
```