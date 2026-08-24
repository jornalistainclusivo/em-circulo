from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers import care_groups, tasks, protocols, care_recipients, invites, users, notifications, appointments, documents, weekly_reports
from app.auth import router as auth_router
from app.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Em Círculo API",
    description="Plataforma dedicada à organização e coordenação da rede de apoio.",
    version="0.2.0",
    lifespan=lifespan
)

app.include_router(care_groups.router)
app.include_router(care_recipients.router)
app.include_router(tasks.router)
app.include_router(protocols.router)
app.include_router(invites.router)
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(appointments.router)
app.include_router(documents.router)
app.include_router(weekly_reports.router)
app.include_router(auth_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
