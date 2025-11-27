from sqlalchemy import create_engine, text

# Hardcoded URL from alembic.ini
DATABASE_URL = "postgresql://nifty_user:nifty_pass@localhost:5432/nifty_trading"
engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    try:
        connection.execute(text("DROP TABLE alembic_version"))
        print("Dropped alembic_version table.")
        connection.commit()
    except Exception as e:
        print(f"Error dropping table (might not exist): {e}")
