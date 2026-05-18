import sqlite3
import pandas as pd
import os

db_path = 'Artifacts/movies.db'
csv_path = 'Artifacts/main_data.csv'

def setup_database():
    print("Bắt đầu di chuyển dữ liệu từ CSV sang SQLite...")
    
    # Kiểm tra xem file db đã tồn tại chưa, nếu có thì xóa đi để làm lại từ đầu
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Đã xóa file database cũ: {db_path}")

    # Đọc dữ liệu từ CSV
    df = pd.read_csv(csv_path)
    print(f"Đã đọc {len(df)} dòng từ {csv_path}")

    # Kết nối SQLite
    conn = sqlite3.connect(db_path)
    
    # Ghi dataframe vào table 'movies'
    df.to_sql('movies', conn, if_exists='replace', index=False)
    print("Đã tạo bảng 'movies' và chèn dữ liệu.")

    # Tạo index trên cột movie_title để tìm kiếm nhanh hơn
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_movie_title ON movies (movie_title)")
    conn.commit()
    print("Đã tạo index cho cột 'movie_title'.")
    
    conn.close()
    print("Hoàn tất! Database đã sẵn sàng tại:", db_path)

if __name__ == '__main__':
    setup_database()
