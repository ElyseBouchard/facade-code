# Facade roller test: Feather RP2040 + AS5600 over STEMMA QT (CircuitPython).
# Streams CSV over USB: timestamp_ms,raw_angle,distance_mm,magnet_status
# Lines starting with "#" are status messages, not data.
import time

import adafruit_as5600
import board

from roller import RollerTracker

# Change this to your roller's measured diameter.
WHEEL_DIAMETER_MM = 40.0
# Flip to -1 if rolling forward makes the distance go down.
DIRECTION = 1
SAMPLE_PERIOD_S = 0.02  # About 50 readings per second


def connect_sensor():
    """Keep trying until the AS5600 answers, so a loose cable can't crash the board."""
    while True:
        try:
            return adafruit_as5600.AS5600(board.STEMMA_I2C())
        except (RuntimeError, ValueError, OSError) as error:
            print("# AS5600 not found, check the STEMMA QT cable:", error)
            time.sleep(1)


def magnet_status(sensor):
    if sensor.min_gain_overflow:
        return "too_strong"
    if sensor.max_gain_overflow:
        return "too_weak"
    if sensor.magnet_detected:
        return "ok"
    return "not_detected"


sensor = connect_sensor()
tracker = RollerTracker(WHEEL_DIAMETER_MM, DIRECTION)
start = time.monotonic_ns()
print("# AS5600 connected")
print("timestamp_ms,raw_angle,distance_mm,magnet_status")

while True:
    try:
        angle = sensor.raw_angle
        status = magnet_status(sensor)
    except OSError as error:
        # A brief I2C glitch shouldn't stop a scan. Distance resumes on the next read.
        print("# I2C read failed:", error)
        time.sleep(SAMPLE_PERIOD_S)
        continue

    distance_mm = tracker.update(angle)
    timestamp_ms = (time.monotonic_ns() - start) // 1000000
    print("{},{},{:.2f},{}".format(timestamp_ms, angle, distance_mm, status))
    time.sleep(SAMPLE_PERIOD_S)
