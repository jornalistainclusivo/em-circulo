import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import CareGroup, CareRecipient, MedicationProtocol, Notification, NotificationType
from app.scheduler import check_delayed_medications
from sqlalchemy.ext.asyncio import create_async_engine
from app import scheduler
import os
from contextlib import asynccontextmanager

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

@pytest.fixture
async def setup_entities(async_session: AsyncSession):
    # Setup Group
    group = CareGroup(name="Test Group Cron")
    async_session.add(group)
    await async_session.commit()
    
    # Setup Recipient
    recipient = CareRecipient(care_group_id=group.id, name="Test Recipient Cron")
    async_session.add(recipient)
    await async_session.commit()
    
    return group, recipient

@pytest.mark.asyncio
async def test_scheduler_no_alert_on_time(async_session: AsyncSession, setup_entities):
    """Medicação no prazo (atraso < 10 min) -> Não deve alertar"""
    group, recipient = setup_entities
    
    now = utc_now()
    # Atrasado apenas 5 min
    next_due = now - timedelta(minutes=5)
    
    protocol = MedicationProtocol(
        care_recipient_id=recipient.id,
        medication_name="Med No Prazo",
        dosage="1",
        next_due_at=next_due
    )
    async_session.add(protocol)
    await async_session.commit()
    
    await check_delayed_medications(session=async_session)
    
    # Assertions
    stmt = select(Notification).where(Notification.care_group_id == group.id)
    notifs = (await async_session.execute(stmt)).all()
    assert len(notifs) == 0

@pytest.mark.asyncio
async def test_scheduler_alert_delayed_no_lock(async_session: AsyncSession, setup_entities):
    """Medicação atrasada (> 10 min) SEM trava -> Deve alertar e setar trava"""
    group, recipient = setup_entities
    
    now = utc_now()
    # Atrasado 15 min
    next_due = now - timedelta(minutes=15)
    
    protocol = MedicationProtocol(
        care_recipient_id=recipient.id,
        medication_name="Med Atrasado Sem Trava",
        dosage="1",
        next_due_at=next_due,
        last_delay_alert_sent_at=None
    )
    async_session.add(protocol)
    await async_session.commit()
    
    await check_delayed_medications(session=async_session)
    
    # Assertions
    await async_session.refresh(protocol)
    assert protocol.last_delay_alert_sent_at is not None
    assert protocol.last_delay_alert_sent_at.replace(tzinfo=None) > next_due
    
    stmt = select(Notification).where(Notification.care_group_id == group.id)
    notifs = (await async_session.execute(stmt)).scalars().all()
    assert len(notifs) == 1
    assert notifs[0].type == NotificationType.DOSE_ATRASADA

@pytest.mark.asyncio
async def test_scheduler_alert_delayed_old_lock(async_session: AsyncSession, setup_entities):
    """Medicação atrasada COM trava antiga (lock < next_due) -> Deve alertar para NOVA dose e atualizar trava"""
    group, recipient = setup_entities
    
    now = utc_now()
    # Atrasado 15 min
    next_due = now - timedelta(minutes=15)
    
    # Trava de 12 horas atrás (dose anterior)
    old_lock = now - timedelta(hours=12, minutes=15)
    
    protocol = MedicationProtocol(
        care_recipient_id=recipient.id,
        medication_name="Med Atrasado Trava Antiga",
        dosage="1",
        next_due_at=next_due,
        last_delay_alert_sent_at=old_lock
    )
    async_session.add(protocol)
    await async_session.commit()
    
    await check_delayed_medications(session=async_session)
    
    # Assertions
    await async_session.refresh(protocol)
    assert protocol.last_delay_alert_sent_at.replace(tzinfo=None) > old_lock
    assert protocol.last_delay_alert_sent_at.replace(tzinfo=None) > next_due
    
    stmt = select(Notification).where(Notification.care_group_id == group.id)
    notifs = (await async_session.execute(stmt)).scalars().all()
    assert len(notifs) == 1
    assert notifs[0].type == NotificationType.DOSE_ATRASADA

@pytest.mark.asyncio
async def test_scheduler_ignore_delayed_current_lock(async_session: AsyncSession, setup_entities):
    """Medicação atrasada COM trava atual (lock >= next_due) -> Proteção Anti-Spam: NÃO deve alertar"""
    group, recipient = setup_entities
    
    now = utc_now()
    # Atrasado 15 min
    next_due = now - timedelta(minutes=15)
    
    # Trava atual (já alertou 2 minutos atrás)
    current_lock = now - timedelta(minutes=2)
    
    protocol = MedicationProtocol(
        care_recipient_id=recipient.id,
        medication_name="Med Atrasado Trava Spam",
        dosage="1",
        next_due_at=next_due,
        last_delay_alert_sent_at=current_lock
    )
    async_session.add(protocol)
    await async_session.commit()
    await async_session.refresh(protocol)
    db_lock_before = protocol.last_delay_alert_sent_at

    await check_delayed_medications(session=async_session)
    
    # Assertions
    await async_session.refresh(protocol)
    # A trava não deve mudar, garantindo que não gerou alerta
    assert protocol.last_delay_alert_sent_at == db_lock_before
    
    stmt = select(Notification).where(Notification.care_group_id == group.id)
    notifs = (await async_session.execute(stmt)).all()
    assert len(notifs) == 0

@pytest.mark.asyncio
async def test_scheduler_no_session_creates_own_session(mocker):
    """Garante que se nenhuma session for passada, ele cria a sua própria a partir do engine."""
    mock_session_maker_class = mocker.patch('app.scheduler.sessionmaker')
    mock_session = mocker.AsyncMock()
    # Quando o session_maker for chamado, ele retorna um mock context manager
    mock_session_maker_class.return_value.return_value.__aenter__.return_value = mock_session
    mock_run_check = mocker.patch('app.scheduler._run_check', new_callable=mocker.AsyncMock)

    from app.scheduler import check_delayed_medications
    await check_delayed_medications()

    # Verifica se sessionmaker foi chamado (usando engine global)
    mock_session_maker_class.assert_called_once()
    # Verifica se o _run_check foi executado com o session criado internamente
    mock_run_check.assert_called_once()
    assert mock_run_check.call_args[0][0] == mock_session

@pytest.mark.asyncio
async def test_scheduler_exception_is_logged(async_session: AsyncSession, mocker):
    """Garante que exceções sejam tratadas e logadas sem quebrar o event loop."""
    mock_logger = mocker.patch('app.scheduler.logger.error')
    
    # Força um erro no _run_check
    mocker.patch('app.scheduler._run_check', side_effect=Exception("DB Error"))
    
    from app.scheduler import check_delayed_medications
    # Não deve levantar exceção para o agendador
    await check_delayed_medications(session=async_session)
    
    # Verifica se logou corretamente
    mock_logger.assert_called_once()
    assert "Erro ao verificar medicações atrasadas" in mock_logger.call_args[0][0]
    assert "DB Error" in mock_logger.call_args[0][0]
