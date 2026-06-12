import io
import csv
import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.models.catalogos import MetaPresupuestal, FuenteFinanciamiento
from app.schemas.catalogo import (
    CentroCostoCreate, CentroCostoOut, ClasificacionGastoCreate, ClasificacionGastoOut, ClasificacionGastoUpdate,
    MetaPresupuestalCreate, MetaPresupuestalOut,
    FuenteFinanciamientoCreate, FuenteFinanciamientoOut, BulkDeleteRequest
)

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])

# ==========================================================
# ENTIDADES
# ==========================================================
@router.get("/entidades")
async def listar_entidades(
    activo: str = Query("true"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    query = select(Entidad)
    if activo == "true":
        query = query.where(Entidad.activo == True)
    elif activo == "false":
        query = query.where(Entidad.activo == False)
    if search:
        query = query.where(or_(
            Entidad.nombre.ilike(f"%{search}%"),
            Entidad.ruc.ilike(f"%{search}%"),
        ))
    query = query.order_by(Entidad.nombre)
    result = await db.execute(query)
    return result.scalars().all()


# ==========================================================
# CENTROS DE COSTO (GET con JOIN + CRUD)
# ==========================================================
@router.get("/centros-costo")
async def listar_centros_costo(
    entidad_id: str | None = None,
    activo: str = Query("true"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista centros de costo con JOIN a Entidad para traer nombre y RUC."""
    query = (
        select(
            CentroCosto,
            Entidad.nombre.label("entidad_nombre"),
            Entidad.ruc.label("entidad_ruc"),
        )
        .join(Entidad, CentroCosto.entidad_id == Entidad.id)
    )
    if entidad_id:
        query = query.where(CentroCosto.entidad_id == entidad_id)
    if activo == "true":
        query = query.where(CentroCosto.activo == True)
    elif activo == "false":
        query = query.where(CentroCosto.activo == False)
    if search:
        query = query.where(or_(
            CentroCosto.nombre.ilike(f"%{search}%"),
            CentroCosto.codigo.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        ))
    query = query.order_by(Entidad.nombre, CentroCosto.codigo)
    result = await db.execute(query)
    rows = result.all()

    data = []
    for row in rows:
        cc = row[0]
        data.append({
            "id": str(cc.id),
            "entidad_id": str(cc.entidad_id),
            "codigo": cc.codigo,
            "nombre": cc.nombre,
            "activo": cc.activo,
            "entidad_nombre": row[1],
            "entidad_ruc": row[2],
        })
    return data


@router.post("/centros-costo", response_model=CentroCostoOut)
async def crear_centro_costo(
    data: CentroCostoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(
        select(CentroCosto).where(
            CentroCosto.entidad_id == data.entidad_id,
            CentroCosto.codigo == data.codigo,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe un centro con código {data.codigo} para esta entidad")

    cc = CentroCosto(id=uuid.uuid4(), **data.model_dump())
    db.add(cc)
    await db.commit()
    await db.refresh(cc)
    return cc


@router.put("/centros-costo/{cc_id}", response_model=CentroCostoOut)
async def actualizar_centro_costo(
    cc_id: uuid.UUID,
    data: CentroCostoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(select(CentroCosto).where(CentroCosto.id == cc_id))
    cc = result.scalar_one_or_none()
    if not cc:
        raise HTTPException(404, "Centro de costo no encontrado")

    # Validar unicidad si cambió el código
    if cc.codigo != data.codigo or cc.entidad_id != data.entidad_id:
        dup = await db.execute(
            select(CentroCosto).where(
                CentroCosto.entidad_id == data.entidad_id,
                CentroCosto.codigo == data.codigo,
                CentroCosto.id != cc_id,
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(400, "Ya existe otro centro con ese código en la entidad")

    for key, value in data.model_dump().items():
        setattr(cc, key, value)
    await db.commit()
    await db.refresh(cc)
    return cc

# ==========================================================
# METAS PRESUPUESTALES (GET con JOIN + CRUD)
# ==========================================================
@router.get("/metas-presupuestales")
async def listar_metas(
    entidad_id: str | None = None,
    anio_fiscal: int | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista metas con JOIN a Entidad."""
    query = (
        select(
            MetaPresupuestal,
            Entidad.nombre.label("entidad_nombre"),
            Entidad.ruc.label("entidad_ruc"),
        )
        .join(Entidad, MetaPresupuestal.entidad_id == Entidad.id)
    )
    if entidad_id:
        query = query.where(MetaPresupuestal.entidad_id == entidad_id)
    if anio_fiscal:
        query = query.where(MetaPresupuestal.anio_fiscal == anio_fiscal)
    if search:
        query = query.where(or_(
            MetaPresupuestal.nombre.ilike(f"%{search}%"),
            MetaPresupuestal.codigo.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        ))
    query = query.order_by(desc(MetaPresupuestal.anio_fiscal), Entidad.nombre, MetaPresupuestal.codigo)
    result = await db.execute(query)
    rows = result.all()

    data = []
    for row in rows:
        m = row[0]
        data.append({
            "id": str(m.id),
            "entidad_id": str(m.entidad_id),
            "codigo": m.codigo,
            "nombre": m.nombre,
            "anio_fiscal": m.anio_fiscal,
            "entidad_nombre": row[1],
            "entidad_ruc": row[2],
        })
    return data


@router.post("/metas-presupuestales", response_model=MetaPresupuestalOut)
async def crear_meta(
    data: MetaPresupuestalCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(
        select(MetaPresupuestal).where(
            MetaPresupuestal.entidad_id == data.entidad_id,
            MetaPresupuestal.codigo == data.codigo,
            MetaPresupuestal.anio_fiscal == data.anio_fiscal,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe una meta {data.codigo} para el año {data.anio_fiscal}")

    meta = MetaPresupuestal(id=uuid.uuid4(), **data.model_dump())
    db.add(meta)
    await db.commit()
    await db.refresh(meta)
    return meta


@router.put("/metas-presupuestales/{meta_id}", response_model=MetaPresupuestalOut)
async def actualizar_meta(
    meta_id: uuid.UUID,
    data: MetaPresupuestalCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(select(MetaPresupuestal).where(MetaPresupuestal.id == meta_id))
    meta = result.scalar_one_or_none()
    if not meta:
        raise HTTPException(404, "Meta no encontrada")

    dup = await db.execute(
        select(MetaPresupuestal).where(
            MetaPresupuestal.entidad_id == data.entidad_id,
            MetaPresupuestal.codigo == data.codigo,
            MetaPresupuestal.anio_fiscal == data.anio_fiscal,
            MetaPresupuestal.id != meta_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, "Ya existe otra meta con ese código y año")

    for key, value in data.model_dump().items():
        setattr(meta, key, value)
    await db.commit()
    await db.refresh(meta)
    return meta


# ==========================================================
# FUENTES DE FINANCIAMIENTO (CRUD)
# ==========================================================
@router.get("/fuentes-financiamiento")
async def listar_fuentes(
    activo: str = Query("true"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    query = select(FuenteFinanciamiento)
    if activo == "true":
        query = query.where(FuenteFinanciamiento.activo == True)
    elif activo == "false":
        query = query.where(FuenteFinanciamiento.activo == False)
    if search:
        query = query.where(or_(
            FuenteFinanciamiento.nombre.ilike(f"%{search}%"),
            FuenteFinanciamiento.codigo.ilike(f"%{search}%"),
        ))
    query = query.order_by(FuenteFinanciamiento.codigo)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/fuentes-financiamiento", response_model=FuenteFinanciamientoOut)
async def crear_fuente(
    data: FuenteFinanciamientoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(
        select(FuenteFinanciamiento).where(FuenteFinanciamiento.codigo == data.codigo)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe una fuente con código {data.codigo}")

    fuente = FuenteFinanciamiento(id=uuid.uuid4(), **data.model_dump())
    db.add(fuente)
    await db.commit()
    await db.refresh(fuente)
    return fuente


@router.put("/fuentes-financiamiento/{fuente_id}", response_model=FuenteFinanciamientoOut)
async def actualizar_fuente(
    fuente_id: uuid.UUID,
    data: FuenteFinanciamientoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    result = await db.execute(select(FuenteFinanciamiento).where(FuenteFinanciamiento.id == fuente_id))
    fuente = result.scalar_one_or_none()
    if not fuente:
        raise HTTPException(404, "Fuente no encontrada")

    dup = await db.execute(
        select(FuenteFinanciamiento).where(
            FuenteFinanciamiento.codigo == data.codigo,
            FuenteFinanciamiento.id != fuente_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, "Ya existe otra fuente con ese código")

    for key, value in data.model_dump().items():
        setattr(fuente, key, value)
    await db.commit()
    await db.refresh(fuente)
    return fuente


# ==========================================================
# PLANTILLAS CSV (CORREGIDO - UTF-8 BOM para Excel)
# ==========================================================
@router.get("/plantilla/{tipo}")
async def descargar_plantilla(
    tipo: str,
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Genera CSV con BOM UTF-8 para compatibilidad con Excel."""
    headers = []
    filename = ""
    example_row = []

    if tipo == "centros-costo":
        headers = ["ruc_entidad", "codigo", "nombre"]
        example_row = ["20131380014", "001", "Dirección General de Salud"]
        filename = "plantilla_centros_costo.csv"
    elif tipo == "metas-presupuestales":
        headers = ["ruc_entidad", "codigo", "nombre", "anio_fiscal"]
        example_row = ["20131380014", "00001", "Atención de salud a la población", "2026"]
        filename = "plantilla_metas_presupuestales.csv"
    elif tipo == "fuentes-financiamiento":
        headers = ["codigo", "nombre", "tipo_rubro"]
        example_row = ["1", "Recursos Ordinarios", "RO"]
        filename = "plantilla_fuentes_financiamiento.csv"
    else:
        raise HTTPException(400, "Tipo de catálogo no válido")

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(headers)
    writer.writerow(example_row)

    # BOM UTF-8 para que Excel reconozca tildes y ñ correctamente
    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


# ==========================================================
# IMPORTACIÓN MASIVA (UPSERT)
# ==========================================================
@router.post("/importar/{tipo}")
async def importar_catalogo(
    tipo: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Solo se permiten archivos CSV")

    try:
        contents = await file.read()
        # Detectar y remover BOM si existe
        text = contents.decode("utf-8-sig")
        df = pd.read_csv(io.StringIO(text), dtype=str).fillna("")
    except Exception as e:
        raise HTTPException(400, f"Error al leer el archivo: {str(e)}")

    # --- CENTROS DE COSTO ---
    if tipo == "centros-costo":
        required = {"ruc_entidad", "codigo", "nombre"}
        if not required.issubset(df.columns):
            raise HTTPException(400, f"El CSV debe tener las columnas: {required}")

        rucs = [str(r).strip() for r in df["ruc_entidad"].unique() if str(r).strip()]
        result = await db.execute(select(Entidad).where(Entidad.ruc.in_(rucs)))
        ruc_map = {str(e.ruc): e.id for e in result.scalars().all()}

        records, errors = [], []
        for idx, row in df.iterrows():
            ruc = str(row["ruc_entidad"]).strip()
            codigo = str(row["codigo"]).strip()
            nombre = str(row["nombre"]).strip()
            if not ruc or not codigo or not nombre:
                errors.append(f"Fila {idx+2}: campos vacíos") # type: ignore
                continue
            if ruc not in ruc_map:
                errors.append(f"Fila {idx+2}: RUC {ruc} no encontrado") # type: ignore
                continue
            records.append({
                "id": uuid.uuid4(),
                "entidad_id": ruc_map[ruc],
                "codigo": codigo,
                "nombre": nombre,
                "activo": True,
            })

        if records:
            stmt = pg_insert(CentroCosto).values(records).on_conflict_do_update(
                index_elements=["entidad_id", "codigo"],
                set_={"nombre": pg_insert(CentroCosto).excluded.nombre, "activo": True},
            )
            await db.execute(stmt)
            await db.commit()
        return {"mensaje": "Importación completada", "exitosos": len(records), "errores": len(errors), "detalles_error": errors[:20]}

    # --- METAS PRESUPUESTALES ---
    elif tipo == "metas-presupuestales":
        required = {"ruc_entidad", "codigo", "nombre", "anio_fiscal"}
        if not required.issubset(df.columns):
            raise HTTPException(400, f"El CSV debe tener las columnas: {required}")

        rucs = [str(r).strip() for r in df["ruc_entidad"].unique() if str(r).strip()]
        result = await db.execute(select(Entidad).where(Entidad.ruc.in_(rucs)))
        ruc_map = {str(e.ruc): e.id for e in result.scalars().all()}

        records, errors = [], []
        for idx, row in df.iterrows():
            ruc = str(row["ruc_entidad"]).strip()
            codigo = str(row["codigo"]).strip()
            nombre = str(row["nombre"]).strip()
            try:
                anio = int(row["anio_fiscal"])
            except:
                errors.append(f"Fila {idx+2}: año inválido") # type: ignore
                continue
            if not ruc or not codigo or not nombre:
                errors.append(f"Fila {idx+2}: campos vacíos") # type: ignore
                continue
            if ruc not in ruc_map:
                errors.append(f"Fila {idx+2}: RUC {ruc} no encontrado") # type: ignore
                continue
            records.append({
                "id": uuid.uuid4(),
                "entidad_id": ruc_map[ruc],
                "codigo": codigo,
                "nombre": nombre,
                "anio_fiscal": anio,
            })

        if records:
            stmt = pg_insert(MetaPresupuestal).values(records).on_conflict_do_update(
                index_elements=["entidad_id", "codigo", "anio_fiscal"],
                set_={"nombre": pg_insert(MetaPresupuestal).excluded.nombre},
            )
            await db.execute(stmt)
            await db.commit()
        return {"mensaje": "Importación completada", "exitosos": len(records), "errores": len(errors), "detalles_error": errors[:20]}

    # --- FUENTES DE FINANCIAMIENTO ---
    elif tipo == "fuentes-financiamiento":
        required = {"codigo", "nombre"}
        if not required.issubset(df.columns):
            raise HTTPException(400, f"El CSV debe tener las columnas: {required}")

        records = []
        for _, row in df.iterrows(): # type: ignore
            codigo = str(row["codigo"]).strip()
            nombre = str(row["nombre"]).strip()
            if not codigo or not nombre:
                continue
            tipo_rubro = str(row.get("tipo_rubro", "")).strip() or None
            records.append({
                "id": uuid.uuid4(),
                "codigo": codigo,
                "nombre": nombre,
                "tipo_rubro": tipo_rubro,
                "activo": True,
            })

        if records:
            stmt = pg_insert(FuenteFinanciamiento).values(records).on_conflict_do_update(
                index_elements=["codigo"],
                set_={
                    "nombre": pg_insert(FuenteFinanciamiento).excluded.nombre,
                    "tipo_rubro": pg_insert(FuenteFinanciamiento).excluded.tipo_rubro,
                },
            )
            await db.execute(stmt)
            await db.commit()
        return {"mensaje": "Importación completada", "exitosos": len(records), "errores": 0}

    raise HTTPException(400, "Tipo de catálogo no válido")


##############################################################################
#                                   FUENTES                                  #
##############################################################################
@router.get("/fuentes")
async def listar_fuentes_datos(
    activo: str = Query("true"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    query = select(FuenteDatos)
    if activo == "true":
        query = query.where(FuenteDatos.activo == True)
    elif activo == "false":
        query = query.where(FuenteDatos.activo == False)
    if search:
        query = query.where(or_(
            FuenteDatos.nombre.ilike(f"%{search}%")
        ))
    query = query.order_by(FuenteDatos.nombre)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/centros-costo/bulk-delete")
async def eliminar_centros_costo_masivo(
    data: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))  # Solo Admin
):
    """Elimina múltiples centros de costo de una sola vez"""
    if not data.ids:
        raise HTTPException(400, "Debe proporcionar al menos un ID")
    
    result = await db.execute(
        select(CentroCosto).where(CentroCosto.id.in_(data.ids))
    )
    centros = result.scalars().all()
    
    if not centros:
        raise HTTPException(404, "No se encontraron centros de costo")
    
    for cc in centros:
        await db.delete(cc)
    
    await db.commit()
    return {"message": f"{len(centros)} centros de costo eliminados exitosamente"}


@router.post("/metas-presupuestales/bulk-delete")
async def eliminar_metas_masivo(
    data: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Elimina múltiples metas presupuestales de una sola vez"""
    if not data.ids:
        raise HTTPException(400, "Debe proporcionar al menos un ID")
    
    result = await db.execute(
        select(MetaPresupuestal).where(MetaPresupuestal.id.in_(data.ids))
    )
    metas = result.scalars().all()
    
    if not metas:
        raise HTTPException(404, "No se encontraron metas presupuestales")
    
    for meta in metas:
        await db.delete(meta)
    
    await db.commit()
    return {"message": f"{len(metas)} metas presupuestales eliminadas exitosamente"}


@router.post("/fuentes-financiamiento/bulk-delete")
async def eliminar_fuentes_masivo(
    data: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Elimina múltiples fuentes de financiamiento de una sola vez"""
    if not data.ids:
        raise HTTPException(400, "Debe proporcionar al menos un ID")
    
    result = await db.execute(
        select(FuenteFinanciamiento).where(FuenteFinanciamiento.id.in_(data.ids))
    )
    fuentes = result.scalars().all()
    
    if not fuentes:
        raise HTTPException(404, "No se encontraron fuentes de financiamiento")
    
    for fuente in fuentes:
        await db.delete(fuente)
    
    await db.commit()
    return {"message": f"{len(fuentes)} fuentes de financiamiento eliminadas exitosamente"}

# ==========================================
# ELIMINACIÓN INDIVIDUAL (Admin + Analista)
# ==========================================

@router.delete("/centros-costo/{cc_id}")
async def eliminar_centro_costo(
    cc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))  # ← Cambiado
):
    """Elimina un centro de costo (si no tiene gastos asociados)"""
    # Verificar si hay gastos asociados
    from app.models.operativas import Gasto
    result_gastos = await db.execute(
        select(func.count(Gasto.id)).where(Gasto.centro_costo_id == cc_id)
    )
    count_gastos = result_gastos.scalar()
    
    if count_gastos and count_gastos > 0:
        raise HTTPException(
            400, 
            f"No se puede eliminar: este centro de costo tiene {count_gastos} gasto(s) asociado(s). "
            "Primero debe eliminar o reasignar los gastos."
        )
    
    result = await db.execute(select(CentroCosto).where(CentroCosto.id == cc_id))
    cc = result.scalar_one_or_none()
    if not cc:
        raise HTTPException(404, "Centro de costo no encontrado")
    
    await db.delete(cc)
    await db.commit()
    return {"message": "Centro de costo eliminado"}


@router.delete("/metas-presupuestales/{meta_id}")
async def eliminar_meta(
    meta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))  # ← Cambiado
):
    """Elimina una meta presupuestal"""
    result = await db.execute(select(MetaPresupuestal).where(MetaPresupuestal.id == meta_id))
    meta = result.scalar_one_or_none()
    if not meta:
        raise HTTPException(404, "Meta no encontrada")
    await db.delete(meta)
    await db.commit()
    return {"message": "Meta eliminada"}


@router.delete("/fuentes-financiamiento/{fuente_id}")
async def eliminar_fuente(
    fuente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))  # ← Cambiado
):
    """Elimina una fuente de financiamiento (si no tiene gastos asociados)"""
    # Verificar si hay gastos asociados
    from app.models.operativas import Gasto
    result_gastos = await db.execute(
        select(func.count(Gasto.id)).where(Gasto.fuente_id == fuente_id) # type: ignore
    )
    count_gastos = result_gastos.scalar()
    
    if count_gastos and count_gastos > 0:
        raise HTTPException(
            400, 
            f"No se puede eliminar: esta fuente tiene {count_gastos} gasto(s) asociado(s). "
            "Primero debe eliminar o reasignar los gastos."
        )
    
    result = await db.execute(select(FuenteFinanciamiento).where(FuenteFinanciamiento.id == fuente_id))
    fuente = result.scalar_one_or_none()
    if not fuente:
        raise HTTPException(404, "Fuente no encontrada")
    await db.delete(fuente)
    await db.commit()
    return {"message": "Fuente eliminada"}

# ==========================================
# CLASIFICADORES DE GASTO (CRUD + MASIVO)
# ==========================================

@router.get("/clasificadores")
async def listar_clasificadores(
    activo: str = Query("true"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista clasificadores de gasto con filtros y búsqueda."""
    query = select(ClasificacionGasto)
    
    if activo == "true":
        query = query.where(ClasificacionGasto.activo == True)
    elif activo == "false":
        query = query.where(ClasificacionGasto.activo == False)
        
    if search:
        query = query.where(or_(
            ClasificacionGasto.codigo.ilike(f"%{search}%"),
            ClasificacionGasto.descripcion.ilike(f"%{search}%"),
            ClasificacionGasto.generica.ilike(f"%{search}%"),
        ))
        
    query = query.order_by(ClasificacionGasto.codigo)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/clasificadores", response_model=ClasificacionGastoOut)
async def crear_clasificador(
    data: ClasificacionGastoCreate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Crea un nuevo clasificador de gasto."""
    result = await db.execute(
        select(ClasificacionGasto).where(ClasificacionGasto.codigo == data.codigo)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe un clasificador con el código {data.codigo}")

    clasificador = ClasificacionGasto(id=uuid.uuid4(), **data.model_dump())
    db.add(clasificador)
    await db.commit()
    await db.refresh(clasificador)
    return clasificador


@router.put("/clasificadores/{clasificador_id}", response_model=ClasificacionGastoOut)
async def actualizar_clasificador(
    clasificador_id: uuid.UUID,
    data: ClasificacionGastoUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Actualiza un clasificador de gasto existente."""
    result = await db.execute(
        select(ClasificacionGasto).where(ClasificacionGasto.id == clasificador_id)
    )
    clasificador = result.scalar_one_or_none()
    if not clasificador:
        raise HTTPException(404, "Clasificador no encontrado")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(clasificador, key, value)
        
    await db.commit()
    await db.refresh(clasificador)
    return clasificador


@router.delete("/clasificadores/{clasificador_id}")
async def eliminar_clasificador(
    clasificador_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Elimina un clasificador (si no tiene gastos asociados)."""
    from app.models.operativas import Gasto
    
    # Validar integridad referencial
    result_gastos = await db.execute(
        select(func.count(Gasto.id)).where(Gasto.clasificacion_gasto_id == clasificador_id)
    )
    count_gastos = result_gastos.scalar()
    
    if count_gastos and count_gastos > 0:
        raise HTTPException(
            400, 
            f"No se puede eliminar: este clasificador tiene {count_gastos} gasto(s) asociado(s)."
        )

    result = await db.execute(
        select(ClasificacionGasto).where(ClasificacionGasto.id == clasificador_id)
    )
    clasificador = result.scalar_one_or_none()
    if not clasificador:
        raise HTTPException(404, "Clasificador no encontrado")
        
    await db.delete(clasificador)
    await db.commit()
    return {"message": "Clasificador eliminado exitosamente"}


# ==========================================
# ELIMINACIÓN MASIVA (Solo Admin)
# ==========================================
@router.post("/clasificadores/bulk-delete")
async def eliminar_clasificadores_masivo(
    data: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador")),
):
    """Elimina múltiples clasificadores de una sola vez."""
    from app.models.operativas import Gasto
    
    if not data.ids:
        raise HTTPException(400, "Debe proporcionar al menos un ID")
        
    # Validar que ninguno tenga gastos asociados
    result_gastos = await db.execute(
        select(func.count(Gasto.id)).where(Gasto.clasificacion_gasto_id.in_(data.ids))
    )
    count_gastos = result_gastos.scalar()
    
    if count_gastos and count_gastos > 0:
        raise HTTPException(
            400, 
            f"No se pueden eliminar: {count_gastos} de los clasificadores seleccionados tienen gastos asociados."
        )

    result = await db.execute(
        select(ClasificacionGasto).where(ClasificacionGasto.id.in_(data.ids))
    )
    clasificadores = result.scalars().all()
    
    if not clasificadores:
        raise HTTPException(404, "No se encontraron clasificadores")
    
    for c in clasificadores:
        await db.delete(c)
        
    await db.commit()
    return {"message": f"{len(clasificadores)} clasificadores eliminados exitosamente"}


# ==========================================
# PLANTILLA CSV PARA CLASIFICADORES
# ==========================================
@router.get("/plantilla/clasificadores")
async def descargar_plantilla_clasificadores(
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Genera y descarga un CSV con la estructura requerida para clasificadores."""
    headers = ["codigo", "descripcion", "generica", "subgenerica", "especifica"]
    filename = "plantilla_clasificadores_gasto.csv"
    
    # Ejemplo realista del sector público peruano
    example_rows = [
        ["2.3.2.1.1", "Equipos médicos y hospitalarios", "Bienes y Servicios", "Bienes", "Equipos médicos"],
        ["2.1.1.1.1", "Personal docente", "Personal y Obligaciones", "Personal", "Docente"],
        ["2.3.2.5.1", "Servicios de consultoría", "Bienes y Servicios", "Servicios", "Consultorías"],
    ]

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(headers)
    for row in example_rows:
        writer.writerow(row)

    # BOM UTF-8 para compatibilidad con Excel
    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


# ==========================================
# IMPORTACIÓN MASIVA (UPSERT)
# ==========================================
@router.post("/importar/clasificadores")
async def importar_clasificadores(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista")),
):
    """Procesa un CSV y realiza UPSERT en los clasificadores de gasto."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Solo se permiten archivos CSV")

    try:
        contents = await file.read()
        text = contents.decode("utf-8-sig")
        df = pd.read_csv(io.StringIO(text), dtype=str).fillna("")
    except Exception as e:
        raise HTTPException(400, f"Error al leer el archivo: {str(e)}")

    required = {"codigo", "descripcion"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"El CSV debe tener al menos las columnas: {required}")

    records, errors = [], []
    for idx, row in df.iterrows():
        codigo = str(row["codigo"]).strip()
        descripcion = str(row["descripcion"]).strip()
        
        if not codigo or not descripcion:
            errors.append(f"Fila {idx+2}: código o descripción vacíos") # type: ignore
            continue
            
        records.append({
            "id": uuid.uuid4(),
            "codigo": codigo,
            "descripcion": descripcion,
            "generica": str(row.get("generica", "")).strip() or None,
            "subgenerica": str(row.get("subgenerica", "")).strip() or None,
            "especifica": str(row.get("especifica", "")).strip() or None,
            "activo": True,
        })

    if records:
        stmt = pg_insert(ClasificacionGasto).values(records).on_conflict_do_update(
            index_elements=["codigo"],
            set_={
                "descripcion": pg_insert(ClasificacionGasto).excluded.descripcion,
                "generica": pg_insert(ClasificacionGasto).excluded.generica,
                "subgenerica": pg_insert(ClasificacionGasto).excluded.subgenerica,
                "especifica": pg_insert(ClasificacionGasto).excluded.especifica,
                "activo": True,
            },
        )
        await db.execute(stmt)
        await db.commit()
        
    return {
        "mensaje": "Importación completada", 
        "exitosos": len(records), 
        "errores": len(errors), 
        "detalles_error": errors[:20]
    }