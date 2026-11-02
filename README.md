# Facade hardware test

Tests the Adafruit Feather RP2040 and AS5600 together. Roll the sensor's magnet
and the laptop shows and saves the distance traveled.

## You need

- Feather RP2040, AS5600, and a STEMMA QT cable (no breadboard or soldering)
- USB-C data cable
- Diametrically magnetized magnet
- A laptop with Python 3

## 1. Connect the boards

With USB unplugged, connect the Feather and AS5600 with the STEMMA QT cable. Center the
magnet over the AS5600 chip, about 0.5-3 mm above it.

## 2. Install CircuitPython

1. Download the stable `.uf2` from <https://circuitpython.org/board/adafruit_feather_rp2040/>.
2. Hold **BOOTSEL** on the Feather, plug in USB, then release. An `RPI-RP2` drive appears.
3. Drag the `.uf2` onto that drive. The board restarts as a `CIRCUITPY` drive.

## 3. Install the libraries and code

From this folder:

```
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python host/setup_board.py
```

This installs the libraries in `firmware/requirements.txt` onto the board with
[circup](https://github.com/adafruit/circup), then copies over `code.py` and `roller.py`.
If the drive isn't found, add `--path` followed by its location.

To install by hand instead, download the bundle matching your CircuitPython version from
<https://circuitpython.org/libraries>. Copy `adafruit_as5600.mpy`, `adafruit_bus_device/`,
and `adafruit_register/` from its `lib` folder into `CIRCUITPY/lib/`. Then copy the two
files from `firmware/` to the root of `CIRCUITPY`.

## 4. Run the test

Close Mu, Thonny, and any other serial console first, since only one program can use the
port at a time.

```
python host/log_serial.py
```

Readings appear live and save to `data/`. Press Ctrl-C to stop and see a summary.

| Check | Expected result |
|---|---|
| Startup | `# AS5600 connected`, then a stream of readings |
| Magnet | Last column says `ok` |
| Turn the magnet slowly | `raw_angle` moves smoothly from 0 to 4095, then wraps around |
| One full forward turn | Distance goes up by about 125.7 mm with the default 40 mm diameter |
| Turn it back | Distance counts back down |

## 5. Calibrate the roller

Once the magnet is mounted on the roller:

1. Measure the roller and set `WHEEL_DIAMETER_MM` in `firmware/code.py`.
2. If rolling forward counts down, set `DIRECTION = -1`.
3. Rerun `python host/setup_board.py`.
4. Roll a tape-measured 1 m, passing your diameter to the script:

```
python host/log_serial.py --expected-mm 1000 --diameter-mm 40
```

The summary shows the error and a corrected diameter. Repeat the run several times to
check that the results agree. To recheck a saved run, use `host/check_run.py`.

## Troubleshooting

| What you see | Likely cause | Fix |
|---|---|---|
| No `RPI-RP2` drive | Charge-only cable or BOOTSEL timing | Try another cable, then repeat the BOOTSEL step |
| `No Feather found` | Board not connected or not running CircuitPython | Check for the `CIRCUITPY` drive, or pass `--port` |
| Port busy or access denied | Another serial console is open | Close it and rerun |
| `# AS5600 not found` | Loose cable | Reseat both ends. The code keeps retrying |
| `not_detected` or `too_weak` | Magnet too far away or off-center | Move it closer and center it |
| `too_strong` | Magnet too close | Increase the gap |
| `raw_angle` jumps | Magnet wobbling, off-center, or the wrong type | Secure it and confirm it's diametrically magnetized |
| `ImportError` on the board | Library missing | Rerun `setup_board.py` or install by hand |

## Project layout

| Path | Purpose |
|---|---|
| `firmware/code.py` | Main program that runs on the Feather |
| `firmware/roller.py` | Converts angle readings into distance |
| `firmware/requirements.txt` | Libraries for the Feather |
| `requirements.txt` | Tools for the laptop |
| `host/setup_board.py` | Installs the libraries and code on the Feather |
| `host/log_serial.py` | Shows and saves live readings |
| `host/check_run.py` | Summarizes a run and calculates calibration |
| `tests/` | Tests that need no hardware: `pip install -r requirements-dev.txt`, then `pytest` |
