from garminconnect import Garmin
from datetime import datetime, timedelta
from typing import List
from models import ActivitySummary, ActivitiesResponse
import logging

logger = logging.getLogger(__name__)

def parse_pace(seconds_per_meter: float) -> str:
    """Zet seconden/meter om naar min:sec/km string."""
    if seconds_per_meter <= 0:
        return "0:00"
    sec_per_km = seconds_per_meter * 1000
    minutes = int(sec_per_km // 60)
    seconds = int(sec_per_km % 60)
    return f"{minutes}:{seconds:02d}"

def get_activities(username: str, password: str) -> ActivitiesResponse:
    """Haal hardloopactiviteiten op van afgelopen 3 maanden."""
    client = Garmin(username, password)
    client.login()

    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)

    activities = client.get_activities_by_date(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d'),
        activitytype='running'
    )

    summaries: List[ActivitySummary] = []
    for act in activities:
        distance_m = act.get('distance', 0)
        duration_s = act.get('duration', 0)

        if distance_m < 500:  # sla te korte activiteiten over
            continue

        summaries.append(ActivitySummary(
            date=act.get('startTimeLocal', '')[:10],
            distance_km=round(distance_m / 1000, 2),
            duration_min=round(duration_s / 60, 1),
            avg_pace_min_km=parse_pace(1 / act['averageSpeed']) if act.get('averageSpeed', 0) > 0 else '0:00',
        ))

    if not summaries:
        return ActivitiesResponse(
            avg_weekly_km=0,
            fastest_pace_min_km='0:00',
            longest_run_km=0,
            activities=[]
        )

    total_km = sum(s.distance_km for s in summaries)
    weeks = max(1, 90 / 7)
    avg_weekly = total_km / weeks
    longest = max(s.distance_km for s in summaries)

    def pace_to_seconds(pace: str) -> float:
        parts = pace.split(':')
        if len(parts) != 2:
            return float('inf')
        return int(parts[0]) * 60 + int(parts[1])

    fastest = min(summaries, key=lambda s: pace_to_seconds(s.avg_pace_min_km))

    return ActivitiesResponse(
        avg_weekly_km=round(avg_weekly, 1),
        fastest_pace_min_km=fastest.avg_pace_min_km,
        longest_run_km=longest,
        activities=summaries[:20],
    )
