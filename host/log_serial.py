#!/usr/bin/env python3
"""Show the Feather's readings live and save them to data/<time>.csv. Ctrl-C stops."""
import argparse
import time
from pathlib import Path

import serial
from serial.tools import list_ports

from check_run import print_report

ADAFRUIT_USB_VENDOR_ID = 0x239A
HEADER = "timestamp_ms,raw_angle,distance_mm,magnet_status"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def find_port():
    ports = sorted(
        port.device for port in list_ports.comports() if port.vid == ADAFRUIT_USB_VENDOR_ID
    )
    if not ports:
        raise SystemExit("No Feather found. Check the USB cable or pass --port.")
    if len(ports) > 1:
        # A board with a second serial channel enabled shows two ports.
        raise SystemExit(f"Several boards found ({', '.join(ports)}). Pass --port.")
    return ports[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="Serial port, if it isn't found automatically")
    parser.add_argument("--expected-mm", type=float, help="Tape-measured distance of this run")
    parser.add_argument("--diameter-mm", type=float, default=40.0,
                        help="WHEEL_DIAMETER_MM set in firmware/code.py")
    args = parser.parse_args()

    DATA_DIR.mkdir(exist_ok=True)
    path = DATA_DIR / time.strftime("run_%Y%m%d_%H%M%S.csv")
    port = args.port or find_port()
    print(f"Reading {port}, saving to {path}. Press Ctrl-C to stop.")

    with serial.Serial(port, 115200, timeout=1) as connection, path.open("w") as output:
        output.write(HEADER + "\n")
        try:
            while True:
                line = connection.readline().decode("utf-8", "replace").strip()
                if not line:
                    continue
                print(line)
                if line != HEADER and len(line.split(",")) == 4 and line[0].isdigit():
                    output.write(line + "\n")
                    output.flush()
        except KeyboardInterrupt:
            print()

    print_report(path, args.expected_mm, args.diameter_mm)


if __name__ == "__main__":
    main()
