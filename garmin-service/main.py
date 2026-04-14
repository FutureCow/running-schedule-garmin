from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import (
    GarminAuthRequest, GarminAuthResponse,
    ActivitiesResponse, UploadRequest, UploadResponse
)
from garmin_client import get_activities
from fit_builder import build_fit
from garminconnect import Garmin, GarminConnectAuthenticationError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Garmin Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth", response_model=GarminAuthResponse)
async def validate_auth(request: GarminAuthRequest):
    """Valideer Garmin Connect credentials."""
    try:
        client = Garmin(request.username, request.password)
        client.login()
        return GarminAuthResponse(success=True, message="Inloggen gelukt")
    except GarminConnectAuthenticationError:
        return GarminAuthResponse(success=False, message="Ongeldig gebruikersnaam of wachtwoord")
    except Exception as e:
        logger.error(f"Garmin auth fout: {e}")
        raise HTTPException(status_code=500, detail="Garmin verbindingsfout")

@app.post("/activities", response_model=ActivitiesResponse)
async def fetch_activities(request: GarminAuthRequest):
    """Haal hardloopactiviteiten op van afgelopen 3 maanden."""
    try:
        return get_activities(request.username, request.password)
    except GarminConnectAuthenticationError:
        raise HTTPException(status_code=401, detail="Garmin authenticatie mislukt")
    except Exception as e:
        logger.error(f"Activiteiten ophalen mislukt: {e}")
        raise HTTPException(status_code=500, detail="Kon activiteiten niet ophalen")

@app.post("/upload", response_model=UploadResponse)
async def upload_workouts(request: UploadRequest):
    """Upload workouts als .fit bestanden naar Garmin Connect."""
    try:
        client = Garmin(request.username, request.password)
        client.login()
    except GarminConnectAuthenticationError:
        raise HTTPException(status_code=401, detail="Garmin authenticatie mislukt")

    uploaded = 0
    failed = 0

    for workout in request.workouts:
        try:
            fit_data = build_fit(workout)
            client.upload_activity(fit_data, f"{workout.dag}-{workout.type}.fit")
            uploaded += 1
        except Exception as e:
            logger.error(f"Upload mislukt voor {workout.dag}: {e}")
            failed += 1

    return UploadResponse(
        success=failed == 0,
        uploaded=uploaded,
        failed=failed,
        message=f"{uploaded} workout(s) geüpload" + (f", {failed} mislukt" if failed else "")
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
