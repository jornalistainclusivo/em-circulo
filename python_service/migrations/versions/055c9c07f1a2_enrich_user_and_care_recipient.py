"""enrich_user_and_care_recipient

Revision ID: 055c9c07f1a2
Revises: a89b7bba4524
Create Date: 2026-07-07 20:24:51.189805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '055c9c07f1a2'
down_revision: Union[str, Sequence[str], None] = 'a89b7bba4524'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to users table
    op.add_column('users', sa.Column('whatsapp', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('profession', sa.String(length=255), nullable=True))
    
    # Add columns to care_recipients table
    op.add_column('care_recipients', sa.Column('medical_conditions', sa.Text(), nullable=True))
    op.add_column('care_recipients', sa.Column('observations', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop columns from care_recipients table
    op.drop_column('care_recipients', 'observations')
    op.drop_column('care_recipients', 'medical_conditions')
    
    # Drop columns from users table
    op.drop_column('users', 'profession')
    op.drop_column('users', 'whatsapp')
