from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GarminAuthRequest(BaseModel):
    username: str
    password: str

class GarminAuthResponse(BaseModel):
    success: bool
    message: str

class ActivitySummary(BaseModel):
    date: str
    distance_km: float
    duration_min: float
    avg_pace_min_km: str

class ActivitiesResponse(BaseModel):
    avg_weekly_km: float
    fastest_pace_min_km: str
    longest_run_km: float
    activities: List[ActivitySummary]

class WorkoutPhase(BaseModel):
    description: str
    distance_km: float
    pace_min_km: str  # "M:SS" formaat

class WorkoutUpload(BaseModel):
    dag: str
    type: str
    distance_km: float
    warmup: WorkoutPhase
    core: WorkoutPhase
    cooldown: WorkoutPhase

class UploadRequest(BaseModel):
    username: str
    password: str
    workouts: List[WorkoutUpload]

class UploadResponse(BaseModel):
    success: bool
    uploaded: int
    failed: int
    message: str
