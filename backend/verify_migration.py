from sqlalchemy import create_engine, inspect

# Hardcoded URL from alembic.ini
DATABASE_URL = "postgresql://nifty_user:nifty_pass@localhost:5432/nifty_trading"
engine = create_engine(DATABASE_URL)

inspector = inspect(engine)
columns = inspector.get_columns('paper_positions')

print("Columns in paper_positions table:")
print("-" * 50)
for col in columns:
    nullable = "NULL" if col['nullable'] else "NOT NULL"
    print(f"{col['name']:30} {str(col['type']):20} {nullable}")
