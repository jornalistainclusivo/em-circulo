import logging
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import sessionmaker

from app.database import engine
from app.models import MedicationProtocol, Notification, NotificationType, CareRecipient

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def _run_check(session: AsyncSession, threshold: datetime, now: datetime):
    stmt = select(MedicationProtocol, CareRecipient).join(
        CareRecipient, MedicationProtocol.care_recipient_id == CareRecipient.id
    ).where(
        and_(
            MedicationProtocol.next_due_at != None,
            MedicationProtocol.next_due_at < threshold,
            or_(
                MedicationProtocol.last_delay_alert_sent_at == None,
                MedicationProtocol.last_delay_alert_sent_at < MedicationProtocol.next_due_at
            )
        )
    )

    result = await session.execute(stmt)
    records = result.all()

    if not records:
        return

    for protocol, recipient in records:
        # Criar notificação
        notification = Notification(
            care_group_id=recipient.care_group_id,
            title="Medicação Atrasada",
            message=f"A medicação {protocol.medication_name} para {recipient.name} está atrasada.",
            type=NotificationType.DOSE_ATRASADA
        )
        session.add(notification)

        # Atualizar trava
        protocol.last_delay_alert_sent_at = now
        session.add(protocol)

    await session.commit()
    logger.info(f"Geradas {len(records)} notificações de atraso.")


async def check_delayed_medications(session: AsyncSession = None):
    """Job to check for delayed medications and send notifications."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    threshold = now - timedelta(minutes=10)

    try:
        if session is None:
            async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session_maker() as s:
                await _run_check(s, threshold, now)
        else:
            await _run_check(session, threshold, now)
    except Exception as e:
        logger.error(f"Erro ao verificar medicações atrasadas: {e}")

scheduler.add_job(check_delayed_medications, 'interval', minutes=1)
