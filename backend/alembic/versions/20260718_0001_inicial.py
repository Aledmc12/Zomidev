"""Revision inicial — esquema ZomiDev"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260718_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("empresa", sa.String(150), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False, server_default="client"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"])
    op.create_index("ix_usuarios_rol", "usuarios", ["rol"])

    op.create_table(
        "proyectos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cliente_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("progreso", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estado", sa.String(30), nullable=False, server_default="activo"),
        sa.Column("staging_url", sa.String(500), nullable=True),
        sa.Column("proxima_entrega", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_proyectos_cliente_id", "proyectos", ["cliente_id"])
    op.create_index("ix_proyectos_estado", "proyectos", ["estado"])

    op.create_table(
        "hitos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proyecto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("estado", sa.String(20), nullable=False, server_default="pendiente"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fecha_inicio", sa.Date(), nullable=True),
        sa.Column("fecha_fin", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "entregables",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proyecto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("archivo_url", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "bitacoras",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proyecto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "previews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proyecto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("imagen_url", sa.String(500), nullable=True),
        sa.Column("staging_url", sa.String(500), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "mensajes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proyecto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("autor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("leido_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "notificaciones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("leida", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("enlace", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "portafolio_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("resumen", sa.String(400), nullable=False),
        sa.Column("problema", sa.Text(), nullable=False),
        sa.Column("solucion", sa.Text(), nullable=False),
        sa.Column("stack", sa.String(300), nullable=False),
        sa.Column("resultado", sa.Text(), nullable=False),
        sa.Column("imagen_url", sa.String(500), nullable=True),
        sa.Column("url_externa", sa.String(500), nullable=True),
        sa.Column("destacado", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "servicios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("icono", sa.String(50), nullable=False, server_default="code"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "about_sections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "team_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("rol", sa.String(120), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "contact_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("empresa", sa.String(150), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "contact_info",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("clave", sa.String(80), nullable=False, unique=True),
        sa.Column("valor", sa.Text(), nullable=False),
        sa.Column("etiqueta", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("contact_info")
    op.drop_table("contact_submissions")
    op.drop_table("team_members")
    op.drop_table("about_sections")
    op.drop_table("servicios")
    op.drop_table("portafolio_items")
    op.drop_table("notificaciones")
    op.drop_table("mensajes")
    op.drop_table("previews")
    op.drop_table("bitacoras")
    op.drop_table("entregables")
    op.drop_table("hitos")
    op.drop_table("proyectos")
    op.drop_table("usuarios")
