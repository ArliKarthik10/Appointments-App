import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "appointments.db")

def drop_and_recreate_tables():
    if not os.path.exists(DB_FILE):
        print(f"DB file not found at {DB_FILE}")
        return
    conn = sqlite3.connect(DB_FILE)
    try:
        cur = conn.cursor()
        # Drop all tables
        cur.execute("DROP TABLE IF EXISTS appointments;")
        cur.execute("DROP TABLE IF EXISTS doctors;")
        cur.execute("DROP TABLE IF EXISTS patients;")
        cur.execute("DROP TABLE IF EXISTS users;")
        conn.commit()
        print("✅ Dropped all tables successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    drop_and_recreate_tables()
