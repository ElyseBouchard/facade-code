"""Run firmware/code.py with the real Adafruit library against a simulated AS5600."""
import runpy
import sys
import time
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "firmware"), str(ROOT / "host")]

from check_run import corrected_diameter, summarize  # noqa: E402
from roller import RollerTracker  # noqa: E402


class FakeAS5600Bus:
    """An I2C bus with one simulated AS5600 register map at 0x36."""

    def __init__(self, angles, status=0x20, fail_at=None):
        self.angles = list(angles)
        self.status = status
        self.fail_at = fail_at
        self.angle_reads = 0
        self.registers = bytearray(256)
        self.pointer = 0

    def try_lock(self):
        return True

    def unlock(self):
        pass

    def scan(self):
        return [0x36]

    def writeto(self, address, buffer, *, start=0, end=None):
        data = bytes(buffer)[start:end]
        if address != 0x36:
            raise ValueError("No I2C device")
        if not data:  # The library probes for the device with an empty write.
            return
        self.pointer = data[0]
        for offset, value in enumerate(data[1:]):
            self.registers[self.pointer + offset] = value

    def readfrom_into(self, address, buffer, *, start=0, end=None):
        end = len(buffer) if end is None else end
        for index in range(start, end):
            buffer[index] = self.read(self.pointer + index - start)

    def writeto_then_readfrom(self, address, out_buffer, in_buffer, *, out_start=0,
                              out_end=None, in_start=0, in_end=None):
        self.writeto(address, out_buffer, start=out_start, end=out_end)
        self.readfrom_into(address, in_buffer, start=in_start, end=in_end)

    def read(self, register):
        if register == 0x0B:
            return self.status
        if register == 0x0C:
            if self.angle_reads == self.fail_at:
                self.angle_reads += 1
                raise OSError("simulated I2C glitch")
            self.current = self.angles[min(self.angle_reads, len(self.angles) - 1)]
            self.angle_reads += 1
            if self.angle_reads > len(self.angles):
                raise StopFirmware
            return self.current >> 8
        if register == 0x0D:
            return self.current & 0xFF
        return self.registers[register]


class StopFirmware(Exception):
    pass


def run_firmware(monkeypatch, capsys, stemma_i2c):
    monkeypatch.setitem(sys.modules, "board", types.SimpleNamespace(STEMMA_I2C=stemma_i2c))
    monkeypatch.setattr(time, "sleep", lambda seconds: None)
    with pytest.raises(StopFirmware):
        runpy.run_path(str(ROOT / "firmware" / "code.py"))
    lines = capsys.readouterr().out.splitlines()
    return lines, [line.split(",") for line in lines if line[0].isdigit()]


def test_firmware_counts_across_wraparound(monkeypatch, capsys):
    bus = FakeAS5600Bus([4000, 4095, 100, 196])
    lines, rows = run_firmware(monkeypatch, capsys, lambda: bus)
    assert "timestamp_ms,raw_angle,distance_mm,magnet_status" in lines
    assert [row[1] for row in rows] == ["4000", "4095", "100", "196"]
    # 292 counts of a 40 mm wheel.
    assert float(rows[-1][2]) == pytest.approx(292 * 3.14159265 * 40 / 4096, abs=0.01)
    assert {row[3] for row in rows} == {"ok"}


@pytest.mark.parametrize(
    "status_register, expected",
    [(0x28, "too_strong"), (0x30, "too_weak"), (0x20, "ok"), (0x00, "not_detected")],
)
def test_firmware_reports_magnet_status(monkeypatch, capsys, status_register, expected):
    bus = FakeAS5600Bus([10, 20], status=status_register)
    _, rows = run_firmware(monkeypatch, capsys, lambda: bus)
    assert rows[0][3] == expected


def test_firmware_survives_i2c_glitch(monkeypatch, capsys):
    bus = FakeAS5600Bus([0, 0, 100], fail_at=1)
    lines, rows = run_firmware(monkeypatch, capsys, lambda: bus)
    assert any(line.startswith("# I2C read failed") for line in lines)
    assert rows[-1][1] == "100"


def test_firmware_waits_for_missing_sensor(monkeypatch, capsys):
    bus = FakeAS5600Bus([1, 2])
    attempts = []

    def stemma_i2c():
        attempts.append(1)
        if len(attempts) == 1:
            raise RuntimeError("No pull up found on SDA or SCL; check your wiring")
        return bus

    lines, rows = run_firmware(monkeypatch, capsys, stemma_i2c)
    assert any("not found" in line for line in lines)
    assert len(rows) == 2


def test_tracker_counts_backward_across_wraparound():
    tracker = RollerTracker(40.0)
    for angle in [100, 0, 4000]:
        distance = tracker.update(angle)
    assert distance == pytest.approx(-196 * tracker.mm_per_count)


def test_tracker_one_full_turn_is_circumference():
    tracker = RollerTracker(40.0)
    for angle in range(0, 4097, 512):
        distance = tracker.update(angle % 4096)
    assert distance == pytest.approx(3.14159265 * 40)


def test_tracker_direction_flip():
    tracker = RollerTracker(40.0, direction=-1)
    tracker.update(0)
    assert tracker.update(100) < 0


def test_summarize_and_calibration(tmp_path):
    path = tmp_path / "run.csv"
    path.write_text(
        "timestamp_ms,raw_angle,distance_mm,magnet_status\n"
        "0,0,0.00,ok\n1000,100,990.00,too_weak\n"
    )
    summary = summarize(path)
    assert summary["rows"] == 2
    assert summary["travel_mm"] == 990
    assert summary["magnet"]["too_weak"] == 1
    assert corrected_diameter(40.0, 990.0, 1000.0) == pytest.approx(40.404, abs=0.001)
