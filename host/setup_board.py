#!/usr/bin/env python3
"""Install the libraries and firmware onto a Feather running CircuitPython."""
import argparse
import os
import shutil
import string
import subprocess
import sys
from pathlib import Path

FIRMWARE = Path(__file__).resolve().parent.parent / "firmware"
FILES = ["roller.py", "code.py"]  # code.py last: saving it restarts the board.


def candidate_paths():
    if os.name == "nt":
        return [Path(f"{letter}:/") for letter in string.ascii_uppercase]
    user = os.environ.get("USER", "")
    return [
        Path("/Volumes/CIRCUITPY"),
        Path("/media") / user / "CIRCUITPY",
        Path("/run/media") / user / "CIRCUITPY",
        Path("/media/CIRCUITPY"),
    ]


def find_board():
    return [path for path in candidate_paths() if (path / "boot_out.txt").exists()]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", type=Path, help="CIRCUITPY drive, if it isn't found automatically")
    args = parser.parse_args()

    boards = [args.path] if args.path else find_board()
    if len(boards) != 1 or not (boards[0] / "boot_out.txt").exists():
        found = ", ".join(str(path) for path in boards) or "none"
        sys.exit(
            f"Need exactly one CircuitPython board (found: {found}). "
            "Plug in one Feather or pass --path."
        )
    drive = boards[0]

    print(f"Installing libraries on {drive}")
    # Prefer the circup installed next to this Python, as in a virtual environment.
    circup = shutil.which("circup", path=str(Path(sys.executable).parent)) or shutil.which("circup")
    if not circup:
        sys.exit("circup isn't installed. Run: pip install -r requirements.txt")
    command = [circup, "--path", str(drive), "install", "-r", str(FIRMWARE / "requirements.txt")]
    if subprocess.run(command).returncode != 0:
        sys.exit("Library install failed. See the circup output above.")

    for name in FILES:
        shutil.copyfile(FIRMWARE / name, drive / name)
        print(f"Copied {name}")
    print("Done. Now run: python host/log_serial.py")


if __name__ == "__main__":
    main()
