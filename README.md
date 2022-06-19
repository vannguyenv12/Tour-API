# I. Giới thiệu về Tour API
- Project sử dụng JavaScript, ExpressJS, MongoDB
- Tổ chức chuẩn theo MVC pattern
- API docs (sử dụng swagger): https://vannguyen-tours.herokuapp.com/api-docs

### Số lượng thành viên tham gia dự án: 1

# II. Tổng quan về Tour API
- Có hỗ trợ các query như: sort, fields, page, limit.

![image](https://user-images.githubusercontent.com/88303019/161365307-06834ec3-e058-4ccd-9a95-ede49a0fee5c.png)

```http
  GET /api/v1/tours
```

| Toán tử | Nghĩa thật     | Cách dùng                |
| :-------- | :------- | :------------------------- |
| `[lte]` | `<=` | /api/v1/tours?price[lte]=100 |
| `[gte]` | `>=` | /api/v1/tours?price[gte]=100 |
| `[ne]` | `!=` | /api/v1/tours?price[ne]=100 |

- Nhiều tính năng hơn nữa như: có bao nhiêu tours được khởi hành trong một năm
- Chức năng rating, review tour
- Sử dụng JWT để làm authentication/authorization, có forgot password và reset password
- Tạo review cho tour (nested param)

![image](https://user-images.githubusercontent.com/88303019/161365416-a692545a-71e3-46bd-a222-4962a7e024ee.png)

... CÒn nữa ... (chưa viết doc xong)...
