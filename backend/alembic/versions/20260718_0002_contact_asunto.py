"""Revision — asunto en contacto y nombre de archivo en entregables"""
from alembic import op
import sqlalchemy as sa

revision = "20260718_0002"
down_revision = "20260718_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contact_submissions", sa.Column("asunto", sa.String(200), nullable=True))
    op.execute("UPDATE contact_submissions SET asunto = 'Consulta general' WHERE asunto IS NULL")
    op.alter_column("contact_submissions", "asunto", nullable=False)

    op.add_column("entregables", sa.Column("archivo_nombre", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("entregables", "archivo_nombre")
    op.drop_column("contact_submissions", "asunto")
