# Đề tài: Hệ thống gợi ý phim

Dự án này xây dựng một hệ thống gợi ý phim cá nhân hóa, giúp người dùng khám phá các bộ phim phù hợp với sở thích của mình dựa trên các kỹ thuật Học máy (Machine Learning).

## Giảng viên hướng dẫn
- **Đào Thị Thúy Quỳnh**

## Nhóm thực hiện: Nhóm 05
### Thành viên:
- **Nguyễn Văn Quân** - B22DCCN666
- **Võ Thanh Huyền** - B22DCCN403
- **Trần Hải Hưng** - B19DCCN733
- **Nguyễn Thành Lâm** - B20DCCN392

## Công nghệ sử dụng
- Python
- Flask
- Numpy, Pandas, Scipy
- Scikit-learn
- NLTK
- Beautifulsoup4 (Cào dữ liệu đánh giá từ IMDB)
- DVC (Quản lý phiên bản dữ liệu)

## Hướng dẫn cài đặt và chạy

### 1. Cài đặt thư viện
Chạy lệnh sau để cài đặt các thư viện cần thiết:
```sh
pip install -r requirements.txt
```

### 2. Chạy ứng dụng
Khởi động server Flask:
```sh
python app.py
```
Sau đó mở trình duyệt và truy cập `http://localhost:5000`.

## Tính năng
- Gợi ý phim dựa trên độ tương đồng nội dung (Content-Based Recommendation).
- Phân tích cảm xúc (Sentiment Analysis) của các đánh giá từ người dùng trên IMDB để xếp loại "Tốt" hoặc "Tệ".
- Tự động hoàn thành tên phim khi tìm kiếm.
