from models import WorkoutUpload, WorkoutPhase


def pace_to_speed_ms(pace_min_km: str) -> float:
    """Zet min:sec/km om naar meter/seconde."""
    parts = pace_min_km.split(':')
    if len(parts) != 2:
        return 0.0
    try:
        sec_per_km = int(parts[0]) * 60 + int(parts[1])
    except ValueError:
        return 0.0
    if sec_per_km == 0:
        return 0.0
    return 1000 / sec_per_km


def build_fit(workout: WorkoutUpload) -> bytes:
    """Bouw een .fit bestand voor één workout en retourneer de bytes."""
    from fit_tool.fit_file_builder import FitFileBuilder
    from fit_tool.profile.messages.file_id_message import FileIdMessage
    from fit_tool.profile.messages.workout_message import WorkoutMessage
    from fit_tool.profile.messages.workout_step_message import WorkoutStepMessage
    from fit_tool.profile.profile_type import (
        FileType, Sport, WorkoutStepDuration, WorkoutStepTarget
    )

    builder = FitFileBuilder()

    # File ID message
    file_id = FileIdMessage()
    file_id.type = FileType.WORKOUT
    builder.add(file_id)

    # Workout message
    # Note: field is workout_name (not wkt_name)
    wkt = WorkoutMessage()
    wkt.sport = Sport.RUNNING
    wkt.workout_name = f"{workout.type.replace('_', ' ').title()} - {workout.dag}"
    wkt.num_valid_steps = 3
    builder.add(wkt)

    # Workout steps: warmup, core, cooldown
    # Note: field is workout_step_name (not wkt_step_name)
    phases = [
        (workout.warmup, 'Warming-up'),
        (workout.core, 'Kern'),
        (workout.cooldown, 'Cooling-down'),
    ]
    for phase, name in phases:
        step = WorkoutStepMessage()
        step.workout_step_name = name
        step.duration_type = WorkoutStepDuration.DISTANCE
        step.duration_distance = phase.distance_km * 1000  # meters
        step.target_type = WorkoutStepTarget.SPEED
        speed = pace_to_speed_ms(phase.pace_min_km)
        step.custom_target_speed_low = speed * 0.95
        step.custom_target_speed_high = speed * 1.05
        builder.add(step)

    fit_file = builder.build()
    # to_bytes() returns the raw bytes directly (to_file only accepts a path string)
    return fit_file.to_bytes()
