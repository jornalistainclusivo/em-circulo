from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

import os
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
