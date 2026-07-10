import os
import sys
import uuid
import subprocess
import asyncpg
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

TEST_DB_NAME = f"test_db_{uuid.uuid4().hex[:8]}"
TEST_DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{TEST_DB_NAME}"

# Set the environment variable so that Alembic and the app use the test DB
os.environ["POSTGRES_DB"] = TEST_DB_NAME

from app.main import app
from app.database import get_session

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    # 1. Connect to postgres to create test DB
    sys_conn = await asyncpg.connect(
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database="postgres"
    )
    await sys_conn.execute(f"CREATE DATABASE {TEST_DB_NAME}")
    await sys_conn.close()

    # 2. Run Alembic migrations
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)

    yield

    # 3. Teardown
    sys_conn = await asyncpg.connect(
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database="postgres"
    )
    await sys_conn.execute(f"""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '{TEST_DB_NAME}'
        AND pid <> pg_backend_pid();
    """)
    await sys_conn.execute(f"DROP DATABASE {TEST_DB_NAME}")
    await sys_conn.close()

from sqlalchemy.pool import NullPool

@pytest_asyncio.fixture(loop_scope="function")
async def async_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=True, future=True, poolclass=NullPool)
    async_session_maker = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_maker() as session:
        yield session
    # Note: engine.dispose() is intentionally omitted.
    # On Windows with asyncio ProactorEventLoop + asyncpg, calling dispose()
    # after pytest closes the event loop causes 'NoneType has no attribute send'.
    # The engine is garbage-collected safely after the test session ends.


@pytest_asyncio.fixture(loop_scope="function")
async def client(async_session: AsyncSession):
    def override_get_session():
        return async_session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
