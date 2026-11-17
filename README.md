# IMMORTAL – Báo danh bang chiến (Node.js + SQL Server)

**Admin** (full quyền) được tạo tự động từ `ADMIN_USER` / `ADMIN_PASSWORD` trong `.env` khi server khởi động. Admin vào tab **Phân quyền** để cấp quyền **Quản trị viên** cho người khác (xếp đội, đăng/xoá sự kiện, xem toàn bộ báo danh). Thành viên tự đăng ký (cần `INVITE_CODE` nếu có đặt) nhưng tài khoản ở trạng thái **chờ duyệt**: Admin hoặc quản trị viên vào tab **Thành viên** để Duyệt hoặc Từ chối. Chỉ khi được duyệt mới đăng nhập được, và thành viên thường chỉ thấy phần báo danh của chính mình. Người đã rời bang có thể bị **Xoá** tài khoản trong tab Thành viên (xoá luôn dữ liệu báo danh/xếp đội của họ). Quản trị viên xoá được thành viên thường; chỉ Admin xoá được quản trị viên.

Nâng cấp từ bản cũ: cột trạng thái được tự thêm vào bảng `users`, các tài khoản đã có sẽ giữ trạng thái đã duyệt.

## Chạy thử trên máy của bạn

**Cần có:** Node.js 18+ (khuyên dùng bản LTS), SQL Server (Express/Developer đều được), SSMS để xem dữ liệu.

1. **Bật đăng nhập SQL** (nếu chưa): SSMS → chuột phải server → Properties → Security → chọn _SQL Server and Windows Authentication mode_, rồi restart dịch vụ SQL Server. Đặt mật khẩu cho `sa` (Security → Logins → sa → Properties) và bật Login: Enabled.
2. **Bật TCP/IP**: SQL Server Configuration Manager → SQL Server Network Configuration → Protocols → TCP/IP = Enabled, rồi restart dịch vụ. (Mặc định cổng 1433. Dùng named instance như `SQLEXPRESS` thì đặt `DB_INSTANCE=SQLEXPRESS` trong .env và bật dịch vụ _SQL Server Browser_.)
3. Trong thư mục dự án:

   npm install
   copy .env.example .env (Mac/Linux: cp .env.example .env)

   # mở .env, điền DB_USER, DB_PASSWORD, ADMIN_PASSWORD

   npm start

4. Mở http://localhost:3000 và đăng nhập bằng tài khoản Admin vừa đặt trong `.env`.

Server tự tạo database `BangHoi` (nếu tài khoản có quyền CREATE DATABASE) và các bảng: users, sessions, reg, teams, events. Nếu không tự tạo được, hãy tạo database rỗng tên `BangHoi` trong SSMS rồi chạy lại.

## Biến môi trường (.env)

`DB_SERVER`, `DB_PORT`, `DB_INSTANCE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT`, `DB_TRUST_CERT` (1 khi SQL Server dùng chứng chỉ tự ký, như máy local), `PORT`, `INVITE_CODE` (mã mời đăng ký, nên đặt khi đưa lên server), `COOKIE_SECURE=1` (khi chạy HTTPS), `TZ_NAME`.

## Khi đưa lên server

- Cài Node và copy dự án (không cần thư mục node_modules), chạy `npm install --omit=dev`.
- Tạo tài khoản SQL riêng có quyền trên database `BangHoi` thay vì dùng `sa`; đặt `DB_TRUST_CERT=0` nếu server có chứng chỉ hợp lệ.
- Chạy nền: Linux dùng `pm2` hoặc systemd; Windows dùng `pm2` hoặc NSSM. Đặt Nginx/IIS làm reverse proxy cổng 3000 và bật HTTPS, rồi đặt `COOKIE_SECURE=1`.
- Sao lưu bằng SQL Server Backup (SSMS → Tasks → Back Up…).

## Ảnh nền riêng

Muốn dùng ảnh nền của riêng bạn (ví dụ ảnh chụp màn hình game của chính bạn, hoặc ảnh bạn có quyền sử dụng), chép vào `public/img/bg.jpg` (khuyên dùng 1920x1080 trở lên, dưới 500 KB). Trang tự phủ ảnh mờ dần lên phía sau và làm tối bớt để chữ dễ đọc. Xoá file là trở về nền mặc định.

## Cấu trúc thư mục

```
server.js            Máy chủ Node.js + API + kết nối SQL Server
package.json         Danh sách thư viện
.env                 Cấu hình (tự tạo từ .env.example, không chia sẻ file này)
public/
  index.html         Khung trang (chỉ có HTML)
  css/
    base.css         Màu, kiểu chữ cơ bản, nền trang (trăng, núi, sương)
    layout.css       Đầu trang, thanh tab, khung nội dung
    components.css   Nút, form, đăng nhập, bảng, thống kê, biểu tượng phái
    pages.css        Xếp đội, đếm ngược, thông báo, responsive
    theme-thuymac.css  Giao diện Thủy Mặc (tranh thuỷ mặc, giấy dó); giao diện Dạ Hàn là mặc định của 4 file trên
  js/                (nạp theo đúng thứ tự dưới đây)
    theme.js         Chọn và nhớ giao diện (nạp ở <head>, chạy đầu tiên)
    config.js        Hằng số, danh sách phái/đội, hàm định dạng
    state.js         Biến trạng thái dùng chung
    api.js           Gọi server, tải dữ liệu, thông báo, làm mới 5 giây
    auth.js          Đăng nhập / đăng ký
    effects.js       Hiệu ứng GSAP, kéo thả, đếm ngược, tuyết rơi, ảnh nền
    views.js         Giao diện từng tab (tổng quan, báo danh, xếp đội, sự kiện, thành viên)
    app.js           Dựng trang, gắn sự kiện, điều hướng, khởi động
  img/               Biểu tượng 8 phái (và bg.jpg nếu bạn thêm)
```

Muốn đổi màu hay hiệu ứng: sửa trong `css/` hoặc `js/effects.js`. Muốn thêm tab mới: viết hàm giao diện trong `views.js`, rồi thêm vào danh sách tab và `route()` trong `app.js`. Các file JS dùng chung biến toàn cục nên **phải giữ đúng thứ tự** thẻ `<script>` trong `index.html`.
Máy chủ đã siết chính sách bảo mật (CSP): trang không còn chạy được script viết thẳng trong HTML, mọi mã JavaScript phải nằm trong thư mục `js/`.

## Hai giao diện

- **Thủy Mặc** (mặc định, sáng): tranh thuỷ mặc trên giấy dó, mặt trời đỏ, núi đá trong sương, chùa, cây tùng, kiếm khách trên vách đá, hạc, tre, thuyền câu. Phong cảnh là SVG nằm trong `index.html` (thẻ `<svg class="scene">`), tre được sinh bằng code trong `js/effects.js`.
- **Dạ Hàn** (tối): đêm trăng, núi phủ sương, tuyết và hoa mai rơi.
  Nút tròn ở góc dưới bên phải để chuyển qua lại; trình duyệt nhớ lựa chọn của từng người. Muốn đổi giao diện mặc định, sửa biến `t` trong `js/theme.js`.
