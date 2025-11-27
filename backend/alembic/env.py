from logging.config import fileConfig
import sys
import os

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Get config from context
config = context.config


# Add backend parent directory to import models
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, BASE_DIR)

# Import settings and models
from app.config import settings
from app.db import Base

from app.models.user import User
from app.models.wallet import Wallet
from app.models.paper_order import PaperOrder
from app.models.paper_position import PaperPosition
from app.models.tournament import Tournament
from app.models.tournament_participant import TournamentParticipant
from app.models.tournament_ranking import TournamentRanking
from app.models.prize_distribution import PrizeDistribution
from app.models.user_settings import UserSettings

# Override database URL
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
