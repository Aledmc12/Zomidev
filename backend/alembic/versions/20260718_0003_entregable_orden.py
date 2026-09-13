"""Revision — orden en entregables"""
from alembic import op
import sqlalchemy as sa

revision = "20260718_0003"
down_revision = "20260718_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "entregables",
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute(
        """
        UPDATE entregables AS e
        SET orden = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY proyecto_id ORDER BY created_at
            ) - 1 AS rn
            FROM entregables
        ) AS sub
        WHERE e.id = sub.id
        """
    )


def downgrade() -> None:
    op.drop_column("entregables", "orden")
