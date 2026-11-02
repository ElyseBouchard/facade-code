"""Turns AS5600 angle readings into distance travelled."""

COUNTS_PER_TURN = 4096
PI = 3.14159265


class RollerTracker:
    def __init__(self, wheel_diameter_mm, direction=1):
        self.mm_per_count = PI * wheel_diameter_mm / COUNTS_PER_TURN
        self.direction = direction
        self.total_counts = 0
        self.previous = None

    def update(self, angle):
        """Add a 0-4095 angle reading and return the total distance in mm.

        A change of more than half a turn is treated as crossing 4095/0, so
        the roller must turn less than half a turn between readings.
        """
        if self.previous is not None:
            change = angle - self.previous
            if change > COUNTS_PER_TURN // 2:
                change -= COUNTS_PER_TURN
            elif change < -(COUNTS_PER_TURN // 2):
                change += COUNTS_PER_TURN
            self.total_counts += change * self.direction
        self.previous = angle
        return self.distance_mm

    @property
    def distance_mm(self):
        return self.total_counts * self.mm_per_count
