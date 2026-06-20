from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case, and_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.evaluacion import EvaluacionPOI
from app.models.seguimiento import AvanceFisico
from app.models.estrategicas import POI
from app.models.dimensionales import Entidad
from app.models.operativas import Gasto
from app.schemas.evaluacion import (
    EvaluacionPOICreate, EvaluacionPOIOut, ResumenEvaluacion
)
import uuid
from typing import Literal
from decimal import Decimal

router = APIRouter(prefix="/evaluacion", tags=["Evaluación Institucional"])


def calcular_indicadores(meta_prog: float, meta_ejec: float, pres_prog: float, pres_ejec: float):
    """Calcula los indicadores de eficiencia"""
    # Índice de Eficacia: % de meta física alcanzada
    indice_eficacia = (meta_ejec / meta_prog * 100) if meta_prog > 0 else 0
    
    # Porcentaje de Ejecución: % del presupuesto gastado
    porcentaje_ejecucion = (pres_ejec / pres_prog * 100) if pres_prog > 0 else 0
    
    # Índice de Eficiencia: relación físico/financiero
    if porcentaje_ejecucion > 0:
        indice_eficiencia = indice_eficacia / porcentaje_ejecucion
    else:
        indice_eficiencia = 0
    
    # Clasificación de riesgo
    if porcentaje_ejecucion > 80 and indice_eficacia < 40:
        nivel_riesgo = "critico"  # Mucho gasto, poco avance
    elif porcentaje_ejecucion > 60 and indice_eficacia < 50:
        nivel_riesgo = "alerta"   # Gasto moderado, avance bajo
    else:
        nivel_riesgo = "normal"
    
    return {
        "indice_eficacia": round(indice_eficacia, 2),
        "indice_eficiencia": round(indice_eficiencia, 2),
        "porcentaje_ejecucion": round(porcentaje_ejecucion, 2),
        "nivel_riesgo": nivel_riesgo,
    }


@router.post("/calcular")
async def calcular_evaluacion_masiva(
    entidad_id: uuid.UUID | None = None,
    anio_fiscal: int = Query(..., description="Año fiscal a evaluar"),
    mes_evaluacion: int = Query(..., ge=1, le=12, description="Mes de evaluación"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    """
    Calcula indicadores de eficiencia para todos los POIs
    Cruza AvanceFisico (Módulo 10) con Gasto (Módulo 9)
    """
    # 1. Obtener todos los POIs activos
    query_pois = select(POI).where(POI.estado == "programada")  # Ajusta según tu lógica de POIs activos
    if entidad_id:
        query_pois = query_pois.where(POI.entidad_id == entidad_id)
    
    result_pois = await db.execute(query_pois)
    pois = result_pois.scalars().all()
    
    evaluaciones_creadas = 0
    
    for poi in pois:
        # 2. Obtener meta física programada y ejecutada del mes desde AvanceFisico
        query_avance = select(AvanceFisico).where(
            and_(
                AvanceFisico.poi_id == poi.id,
                AvanceFisico.anio == anio_fiscal,
                AvanceFisico.mes == mes_evaluacion,
            )
        )
        result_avance = await db.execute(query_avance)
        avance = result_avance.scalar_one_or_none()
        
        meta_programada = float(avance.meta_programada) if avance else 0
        meta_ejecutada = float(avance.meta_ejecutada) if avance else 0
        
        # 3. Obtener presupuesto programado (PIM) - suma de todos los gastos certificados
        query_pim = (
            select(func.sum(Gasto.monto))
            .where(
                and_(
                    Gasto.poi_id == poi.id,
                    Gasto.anio_fiscal == anio_fiscal,
                    Gasto.fase == "certificado",  # Gastos certificados = presupuesto comprometido
                )
            )
        )
        result_pim = await db.execute(query_pim)
        presupuesto_programado = float(result_pim.scalar() or 0)
        
        # 4. Obtener gasto ejecutado (devengado/girado)
        query_gasto = (
            select(func.sum(Gasto.monto))
            .where(
                and_(
                    Gasto.poi_id == poi.id,
                    Gasto.anio_fiscal == anio_fiscal,
                    Gasto.fase.in_(["devengado", "girado"]),
                )
            )
        )
        result_gasto = await db.execute(query_gasto)
        presupuesto_ejecutado = float(result_gasto.scalar() or 0)
        
        # 5. Calcular indicadores
        indicadores = calcular_indicadores(
            meta_programada, meta_ejecutada,
            presupuesto_programado, presupuesto_ejecutado
        )
        
        # 6. Verificar si ya existe evaluación para este POI/mes
        query_existe = select(EvaluacionPOI).where(
            and_(
                EvaluacionPOI.poi_id == poi.id,
                EvaluacionPOI.anio_fiscal == anio_fiscal,
                EvaluacionPOI.mes_evaluacion == mes_evaluacion,
            )
        )
        result_existe = await db.execute(query_existe)
        evaluacion_existente = result_existe.scalar_one_or_none()
        
        if evaluacion_existente:
            # Actualizar
            evaluacion_existente.meta_fisica_programada = meta_programada
            evaluacion_existente.meta_fisica_ejecutada = meta_ejecutada
            evaluacion_existente.presupuesto_programado = presupuesto_programado
            evaluacion_existente.presupuesto_ejecutado = presupuesto_ejecutado
            evaluacion_existente.indice_eficacia = indicadores["indice_eficacia"]
            evaluacion_existente.indice_eficiencia = indicadores["indice_eficiencia"]
            evaluacion_existente.porcentaje_ejecucion = indicadores["porcentaje_ejecucion"]
            evaluacion_existente.nivel_riesgo = indicadores["nivel_riesgo"]
        else:
            # Crear nueva
            evaluacion = EvaluacionPOI(
                id=uuid.uuid4(),
                poi_id=poi.id,
                entidad_id=poi.entidad_id,
                anio_fiscal=anio_fiscal,
                mes_evaluacion=mes_evaluacion,
                meta_fisica_programada=meta_programada,
                meta_fisica_ejecutada=meta_ejecutada,
                presupuesto_programado=presupuesto_programado,
                presupuesto_ejecutado=presupuesto_ejecutado,
                **indicadores
            )
            db.add(evaluacion)
            evaluaciones_creadas += 1
    
    await db.commit()
    
    return {
        "mensaje": f"Evaluación completada para {mes_evaluacion}/{anio_fiscal}",
        "evaluaciones_creadas": evaluaciones_creadas,
        "total_pois": len(pois),
    }


@router.get("/")
async def listar_evaluaciones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    entidad_id: str | None = None,
    anio_fiscal: int | None = None,
    mes_evaluacion: int | None = None,
    nivel_riesgo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Lista evaluaciones con filtros"""
    query = (
        select(
            EvaluacionPOI,
            POI.codigo_actividad.label("poi_codigo"),
            POI.nombre.label("poi_nombre"),
            Entidad.nombre.label("entidad_nombre"),
        )
        .join(POI, EvaluacionPOI.poi_id == POI.id)
        .join(Entidad, EvaluacionPOI.entidad_id == Entidad.id)
    )
    count_query = select(func.count(EvaluacionPOI.id))
    
    # Filtros
    if entidad_id:
        query = query.where(EvaluacionPOI.entidad_id == entidad_id)
        count_query = count_query.where(EvaluacionPOI.entidad_id == entidad_id)
    if anio_fiscal:
        query = query.where(EvaluacionPOI.anio_fiscal == anio_fiscal)
        count_query = count_query.where(EvaluacionPOI.anio_fiscal == anio_fiscal)
    if mes_evaluacion:
        query = query.where(EvaluacionPOI.mes_evaluacion == mes_evaluacion)
        count_query = count_query.where(EvaluacionPOI.mes_evaluacion == mes_evaluacion)
    if nivel_riesgo:
        query = query.where(EvaluacionPOI.nivel_riesgo == nivel_riesgo)
        count_query = count_query.where(EvaluacionPOI.nivel_riesgo == nivel_riesgo)
    
    query = query.order_by(desc(EvaluacionPOI.anio_fiscal), desc(EvaluacionPOI.mes_evaluacion))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    data_out = []
    for row in rows:
        eval_obj = row[0]
        eval_dict = {
            "id": eval_obj.id,
            "poi_id": eval_obj.poi_id,
            "entidad_id": eval_obj.entidad_id,
            "anio_fiscal": eval_obj.anio_fiscal,
            "mes_evaluacion": eval_obj.mes_evaluacion,
            "meta_fisica_programada": float(eval_obj.meta_fisica_programada or 0),
            "meta_fisica_ejecutada": float(eval_obj.meta_fisica_ejecutada or 0),
            "presupuesto_programado": float(eval_obj.presupuesto_programado or 0),
            "presupuesto_ejecutado": float(eval_obj.presupuesto_ejecutado or 0),
            "indice_eficacia": float(eval_obj.indice_eficacia or 0),
            "indice_eficiencia": float(eval_obj.indice_eficiencia or 0),
            "porcentaje_ejecucion": float(eval_obj.porcentaje_ejecucion or 0),
            "nivel_riesgo": eval_obj.nivel_riesgo,
            "creado_en": eval_obj.creado_en,
            "actualizado_en": eval_obj.actualizado_en,
            "poi_codigo": row[1],
            "poi_nombre": row[2],
            "entidad_nombre": row[3],
        }
        data_out.append(eval_dict)
    
    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }


@router.get("/resumen")
async def obtener_resumen(
    entidad_id: str | None = None,
    anio_fiscal: int = Query(...),
    mes_evaluacion: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Resumen agregado para dashboard"""
    query = select(EvaluacionPOI).where(
        and_(
            EvaluacionPOI.anio_fiscal == anio_fiscal,
            EvaluacionPOI.mes_evaluacion == mes_evaluacion,
        )
    )
    
    if entidad_id:
        query = query.where(EvaluacionPOI.entidad_id == entidad_id)
    
    result = await db.execute(query)
    evaluaciones = result.scalars().all()
    
    if not evaluaciones:
        return {
            "total_pois": 0,
            "pois_normales": 0,
            "pois_alerta": 0,
            "pois_criticos": 0,
            "eficacia_promedio": 0,
            "eficiencia_promedio": 0,
            "ejecucion_promedio": 0,
            "presupuesto_total": 0,
            "gasto_total": 0,
        }
    
    total = len(evaluaciones)
    normales = sum(1 for e in evaluaciones if e.nivel_riesgo == "normal")
    alerta = sum(1 for e in evaluaciones if e.nivel_riesgo == "alerta")
    criticos = sum(1 for e in evaluaciones if e.nivel_riesgo == "critico")
    
    eficacia_prom = sum(float(e.indice_eficacia or 0) for e in evaluaciones) / total
    eficiencia_prom = sum(float(e.indice_eficiencia or 0) for e in evaluaciones) / total
    ejecucion_prom = sum(float(e.porcentaje_ejecucion or 0) for e in evaluaciones) / total
    
    presupuesto_total = sum(float(e.presupuesto_programado or 0) for e in evaluaciones)
    gasto_total = sum(float(e.presupuesto_ejecutado or 0) for e in evaluaciones)
    
    return {
        "total_pois": total,
        "pois_normales": normales,
        "pois_alerta": alerta,
        "pois_criticos": criticos,
        "eficacia_promedio": round(eficacia_prom, 2),
        "eficiencia_promedio": round(eficiencia_prom, 2),
        "ejecucion_promedio": round(ejecucion_prom, 2),
        "presupuesto_total": presupuesto_total,
        "gasto_total": gasto_total,
    }


@router.delete("/{evaluacion_id}")
async def eliminar_evaluacion(
    evaluacion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(
        select(EvaluacionPOI).where(EvaluacionPOI.id == evaluacion_id)
    )
    eval_obj = result.scalar_one_or_none()
    if not eval_obj:
        raise HTTPException(404, "Evaluación no encontrada")
    
    await db.delete(eval_obj)
    await db.commit()
    return {"message": "Evaluación eliminada"}