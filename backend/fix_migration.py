"""
Fix migration by adding missing columns to tournaments and tournament_participants tables.
"""
from app.db import engine
from sqlalchemy import text

def fix_migration():
    with engine.connect() as conn:
        try:
            # Create enum type if not exists
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE tournamenttype AS ENUM ('SOLO', 'TEAM');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("✓ Created tournamenttype enum")
        except Exception as e:
            print(f"Enum creation: {e}")
        
        try:
            # Add tournament_type column
            conn.execute(text("""
                ALTER TABLE tournaments 
                ADD COLUMN IF NOT EXISTS tournament_type tournamenttype DEFAULT 'SOLO' NOT NULL;
            """))
            conn.commit()
            print("✓ Added tournament_type column")
        except Exception as e:
            print(f"tournament_type: {e}")
        
        try:
            # Add team_size column
            conn.execute(text("""
                ALTER TABLE tournaments 
                ADD COLUMN IF NOT EXISTS team_size INTEGER;
            """))
            conn.commit()
            print("✓ Added team_size column")
        except Exception as e:
            print(f"team_size: {e}")
        
        try:
            # Create index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_tournaments_tournament_type 
                ON tournaments (tournament_type);
            """))
            conn.commit()
            print("✓ Created index on tournament_type")
        except Exception as e:
            print(f"Index: {e}")
        
        try:
            # Make user_id nullable in tournament_participants
            conn.execute(text("""
                ALTER TABLE tournament_participants 
                ALTER COLUMN user_id DROP NOT NULL;
            """))
            conn.commit()
            print("✓ Made user_id nullable in tournament_participants")
        except Exception as e:
            print(f"user_id nullable: {e}")
        
        try:
            # Add team_id column
            conn.execute(text("""
                ALTER TABLE tournament_participants 
                ADD COLUMN IF NOT EXISTS team_id INTEGER;
            """))
            conn.commit()
            print("✓ Added team_id column to tournament_participants")
        except Exception as e:
            print(f"team_id: {e}")
        
        try:
            # Add foreign key constraint
            conn.execute(text("""
                DO $$ BEGIN
                    ALTER TABLE tournament_participants 
                    ADD CONSTRAINT fk_tournament_participants_team_id 
                    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE;
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("✓ Added foreign key constraint for team_id")
        except Exception as e:
            print(f"FK constraint: {e}")
        
        try:
            # Create index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_tournament_participants_team_id 
                ON tournament_participants (team_id);
            """))
            conn.commit()
            print("✓ Created index on team_id")
        except Exception as e:
            print(f"team_id index: {e}")
        
        print("\n✅ Migration fix completed successfully!")

if __name__ == "__main__":
    fix_migration()
