"""rename_support_to_caregiver

Revision ID: a89b7bba4524
Revises: 89cf76c5a7fd
Create Date: 2026-07-07 18:45:48.218194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a89b7bba4524'
down_revision: Union[str, Sequence[str], None] = '89cf76c5a7fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole RENAME VALUE 'SUPPORT' TO 'CAREGIVER'")


def downgrade() -> None:
    op.execute("ALTER TYPE userrole RENAME VALUE 'CAREGIVER' TO 'SUPPORT'")
