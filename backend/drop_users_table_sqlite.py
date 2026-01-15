import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "appointments.db")

def drop_users_table():
    if not os.path.exists(DB_FILE):
        print(f"DB file not found at {DB_FILE}")
        return
    conn = sqlite3.connect(DB_FILE)
    try:
        cur = conn.cursor()
        cur.execute("DROP TABLE IF EXISTS users;")
        conn.commit()
        print("Dropped users table (if it existed).")
    finally:
        conn.close()

if __name__ == "__main__":
    drop_users_table()
