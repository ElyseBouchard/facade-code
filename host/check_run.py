#!/usr/bin/env python3
"""Summarize a saved run and check it for problems."""
import argparse
import csv
from collections import Counter
from pathlib import Path

MAX_GAP_MS = 100


def summarize(path):
    with Path(path).open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        return None
    times = [int(row["timestamp_ms"]) for row in rows]
    distances = [float(row["distance_mm"]) for row in rows]
    gaps = [later - earlier for earlier, later in zip(times, times[1:])]
    duration_s = (times[-1] - times[0]) / 1000
    return {
        "rows": len(rows),
        "duration_s": duration_s,
        "rate_hz": (len(rows) - 1) / duration_s if duration_s else 0.0,
        "largest_gap_ms": max(gaps, default=0),
        "travel_mm": distances[-1] - distances[0],
        "magnet": Counter(row["magnet_status"] for row in rows),
    }


def corrected_diameter(diameter_mm, measured_mm, expected_mm):
    return diameter_mm * expected_mm / measured_mm


def print_report(path, expected_mm=None, diameter_mm=40.0):
    summary = summarize(path)
    if summary is None:
        print(f"{path}: no readings saved.")
        return
    print(f"Run:       {path}")
    print(f"Readings:  {summary['rows']} over {summary['duration_s']:.1f} s "
          f"({summary['rate_hz']:.0f} per second)")
    print(f"Travel:    {summary['travel_mm']:.1f} mm")
    print(f"Magnet:    {dict(summary['magnet'])}")
    if summary["largest_gap_ms"] > MAX_GAP_MS:
        print(f"WARNING:   readings stopped for {summary['largest_gap_ms']} ms at least once")
    bad = summary["rows"] - summary["magnet"]["ok"]
    if bad:
        print(f"WARNING:   {bad} readings had a magnet problem, so distance may be wrong")
    if expected_mm:
        travel = abs(summary["travel_mm"])
        error = travel - expected_mm
        print(f"Expected:  {expected_mm:.1f} mm, error {error:+.1f} mm "
              f"({100 * error / expected_mm:+.2f}%)")
        if travel:
            print("Set WHEEL_DIAMETER_MM to about "
                  f"{corrected_diameter(diameter_mm, travel, expected_mm):.2f}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file", type=Path)
    parser.add_argument("--expected-mm", type=float, help="Tape-measured distance of this run")
    parser.add_argument("--diameter-mm", type=float, default=40.0,
                        help="WHEEL_DIAMETER_MM used for this run")
    args = parser.parse_args()
    print_report(args.csv_file, args.expected_mm, args.diameter_mm)


if __name__ == "__main__":
    main()
