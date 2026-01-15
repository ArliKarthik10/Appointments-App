from sqlalchemy import text
from app import database

def drop_users_table():
    engine = database.engine
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS users"))
        conn.commit()

if __name__ == "__main__":
    drop_users_table()
    print("Dropped users table (if it existed).")
