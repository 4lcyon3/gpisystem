from pydantic import BaseModel
from decimal import Decimal

class KPIsEjecucion(BaseModel):
    """KPIs principales para el Dashboard (Módulo 15)"""
    pia_total: Decimal
    pim_total: Decimal
    certificado: Decimal
    comprometido: Decimal
    devengado: Decimal
    girado: Decimal
    porcentaje_ejecucion: Decimal
    saldo_disponible: Decimal
    total_entidades: int
    alertas_rojas: int

class EvolucionMensual(BaseModel):
    """Serie de tiempo para gráficos de Recharts"""
    anio: int
    mes: int
    mes_nombre: str
    devengado: Decimal
    girado: Decimal
    pim: Decimal

class RankingEntidad(BaseModel):
    """Top entidades por ejecución"""
    entidad_nombre: str
    ruc: str
    pim: Decimal
    devengado: Decimal
    porcentaje: Decimal

class AlertaOut(BaseModel):
    tipo_alerta: str
    nivel: str  # rojo, amarillo, verde
    mensaje: str
    entidad_nombre: str | None = None