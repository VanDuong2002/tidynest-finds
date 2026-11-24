# TidyNest Finds — Công cụ Affiliate Amazon US & Xưởng Tạo Pin Pinterest

Dự án 2-trong-1 dành cho người mới làm affiliate thị trường Mỹ ngách **Home & Kitchen Finds**:
1. **Trang Web Showcase tiếng Anh chuẩn Mỹ** (đưa lên mạng miễn phí trên Vercel): hiển thị sản phẩm, bộ sưu tập *Top 5...*, đầy đủ trang & ghi chú công khai đúng luật **Amazon Associates US**.
2. **Xưởng Studio Tiếng Việt (`/studio`)**: chỉ chạy trên máy tính của bạn (tự động ẩn / trả về `404` khi đưa lên mạng), gồm 5 tab:
   - **Sản phẩm:** Thêm/sửa/xóa sản phẩm & upload ảnh.
   - **Bộ sưu tập:** Gom nhiều món thành bài *Top list* để kéo nhiều đơn từ 1 Pin.
   - **Xưởng Pin 1000×1500:** Tự thiết kế ảnh Pin dọc 3 mẫu chuẩn Pinterest Mỹ + tự viết 3 phương án tiêu đề/mô tả/hashtag tiếng Anh chuẩn SEO (bấm 1 nút là copy & tải ảnh PNG).
   - **Báo cáo Traffic & Hoa hồng:** Theo dõi lượt xem, lượt click, CTR, tỷ lệ chuyển đổi, doanh thu USD, hoa hồng thực nhận (USD & quy đổi VNĐ), thanh tiến độ **mốc 3 đơn đầu tiên của Amazon**, hỗ trợ **Import 1-click file CSV Amazon Associates**.
   - **Cài đặt & Xuất bản:** Đổi tên thương hiệu, gắn Google Analytics 4 miễn phí, và checklist từng bước.

---

## 1. Cách chạy trên máy tính

Mở PowerShell trong thư mục `d:\Anti_\home-finds-studio` và chạy:

```bash
npm run dev
```

Sau đó mở trình duyệt:
- **Xem trang web Showcase (khách Mỹ sẽ thấy):** `http://localhost:3000`
- **Mở Xưởng Studio quản trị (Tiếng Việt):** `http://localhost:3000/studio`

---

## 2. Quy trình 2 phút mỗi ngày để kiếm hoa hồng

1. Tìm 1 món đồ gia dụng / sắp xếp bếp bán chạy trên **Amazon Best Sellers** hoặc **Amazon Movers & Shakers** (ưu tiên giá \$15–\$45, đánh giá từ 4.4★ trở lên).
2. Lấy link affiliate của bạn bằng thanh **Amazon SiteStripe**.
3. Vào `http://localhost:3000/studio` -> tab **Sản phẩm** -> thêm sản phẩm (hoặc gom vào **Bộ sưu tập**).
4. Bấm **"Tạo ảnh Pin"** -> chọn mẫu đẹp -> tải ảnh PNG `1000×1500px` -> bấm copy tiêu đề, mô tả và link trang web của bạn.
5. Đẩy web cập nhật lên mạng (xem mục 3 bên dưới), rồi đăng ảnh Pin + chữ vừa copy lên **Pinterest Business**.
6. Hàng tuần vào tab **Báo cáo & Hoa hồng** -> bấm **Import CSV Amazon Associates** để xem doanh thu & hoa hồng thực nhận (USD + VNĐ).

---

## 3. Cách đưa web lên mạng miễn phí (0 đồng với Vercel)

1. Tạo 1 repository mới (Public hoặc Private) trên **GitHub** (miễn phí).
2. Kết nối và đẩy code lên GitHub:
   ```bash
   git remote add origin <LINK_REPO_GITHUB_CUA_BAN>
   git push -u origin master
   ```
3. Đăng nhập [vercel.com](https://vercel.com) bằng tài khoản GitHub -> bấm **Add New Project** -> chọn repo vừa tạo -> bấm **Deploy** (giữ nguyên mọi cài đặt mặc định).
4. Sau khoảng 1 phút bạn sẽ có link web miễn phí dạng `https://ten-web-cua-ban.vercel.app`.
5. Vào `http://localhost:3000/studio` -> tab **Cài đặt & Xuất bản** -> dán link Vercel đó vào ô **Đường dẫn web công khai (Base URL)** để Studio tự tạo đúng link gắn lên Pinterest.
6. Mỗi khi thêm sản phẩm mới trên máy, chỉ cần chạy 3 lệnh ngắn:
   ```bash
   git add .
   git commit -m "Update finds"
   git push
   ```
   Vercel sẽ tự động cập nhật trang web công khai sau ~30 giây!

---

## 4. Kiểm thử kỹ thuật

```bash
npm test        # Chạy toàn bộ unit test (storage, copy generator, CSV/analytics, bảo mật 404)
npm run typecheck
npm run build
```
