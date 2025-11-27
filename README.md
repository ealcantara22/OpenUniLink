# OpenUniLink

**OpenUniLink** is a community-driven vendor-neutral PC cooling, RGB control, and LCD peripherals daemon designed for Linux.
It aims to provide a unified interface to control hardware that typically relies on proprietary, Windows-only software (such as L-Connect), allowing users to manage fan curves, lighting effects, and device states directly from a Linux environment.

The focus now is on **Lian Li UNI Fan wireless controllers** (SL / TL and friends), but structured so that other vendors can be supported in the future.

> ⚠️ **Important:** This project is unofficial, experimental and not affiliated with any hardware vendor. Use at your own risk. Make sure of reading the Disclaimer & Safety Warning section below.

## Features

### Overview
- Manage PWM fan speeds and RGB lighting.
- Read hardware states like Fan RPM.
- Currently implementing support for Lian Li Wireless protocols and other USB-HID devices.
- Designed to run as a system service.
- Modular driver architecture for adding new protocols.
- - Runs as a daemon that:
    - Reads system temperatures
    - Applies fan curves to logical “clusters” (AIO, front intake, etc.)
    - Applies lighting profiles
- Ships with a CLI for discovery, debugging and status
- Can be packaged as a **single-file executable** using Node SEA

### current & planned

#### Implemented so far

- **Core**
    - Node.js + TypeScript codebase
    - Pluggable driver architecture (driver registry)
    - YAML-based configuration (`/etc/openunilink/config.yaml`)

- **Lian Li wireless (L-Wireless)**
    - USB/HID transport abstraction
    - Controller discovery via VID/PID
    - Protocol scaffold for wireless receivers (MAC/channel/deviceType)
    - CLI `discover` wired into generic driver discovery

- **Sensors**
    - Sensor abstraction layer (`SensorProvider`)
    - Support for using `systeminformation` / `lm-sensors` / `sysfs` (depending on how you configure it)

- **CLI commands**
    - `openunilink discover` – find supported devices (e.g. Lian Li wireless controller + receivers)
    - `openunilink sensors` – show CPU/GPU temperature as seen by OpenUniLink
    - `openunilink status` – show active profile, temps and calculated PWM per cluster
    - `openunilink daemon` – run the main daemon loop

#### Planned / in progress

- Proper `init-config` command to generate an initial config from discovered receivers
- `assign-role` / `test-fan` helpers for mapping MACs to physical fan clusters
- Additional CLI commands:
    - `set-profile`, `set-pwm`, `set-lighting`, simulation mode
- More drivers (wired hubs, other brands) via the same registry
- **Web UI and/or TUI** on top of the existing CLI/daemon

---

## Architecture overview

High-level layers:

- **CLI / Daemon entry**
    - Binary: `openunilink`
    - Modes:
        - `openunilink daemon --config /etc/openunilink/config.yaml`
        - `openunilink <command> [...]` (discover, sensors, status, …)

- **Core**
    - `core/types.ts` – shared types (profiles, curves, driver config)
    - `core/config.ts` – YAML loading/validation
    - `core/curves.ts` – fan curve interpolation
    - `core/sensors/` – sensor providers (systeminformation, lm-sensors, sysfs, etc.)
    - `core/logging.ts` – basic logging

- **Drivers**
    - `drivers/index.ts` – driver registry & generic discovery
    - `drivers/lianli-wireless/` – L-Wireless-specific:
        - `controllerDiscovery.ts` – find *one* wireless controller (VID/PID-based)
        - `usbTransport.ts` – low-level USB/HID IO
        - `protocol.ts` – wireless protocol (receiver discovery, fan+RGB commands)
        - `index.ts` – `DriverFactory` implementation for `lianli-wireless`

- **Daemon**
    - `daemon/index.ts` – loads config, builds sensors & drivers, runs the loop
    - `daemon/serviceLoop.ts` – read temps → map to PWM → call drivers

- **CLI**
    - `cli/openunilinkCli.ts` – wires subcommands to handlers
    - `cli/handlers/*.ts` – one file per command (e.g. `statusHandler`, `discoveryHandler`, `sensorsHandler`)

---

## Configuration

OpenUniLink reads a YAML config file. By convention: `/etc/openunilink/config.yaml` or you can point to another path via --config for testing.

**Example config**

Below is an example for a system with:
- 1 × AIO fan cluster (aio)
- 2 × front intake clusters (front-top, front-bottom)
All using a single L-Wireless controller, with one receiver per cluster.

```yaml
daemon:
  intervalMs: 2000
  logLevel: info

sensors:
  source: 'systeminformation' # lm-sensors/sysfs support will be added in the future

drivers:
  - id: 'llw-aio'
    type: 'lianli-wireless'
    method: 'usb'
    macs:
      - 'AA:BB:CC:DD:EE:01'  # receiver MAC for the AIO cluster
    role: 'aio'

  - id: 'llw-front-top'
    type: 'lianli-wireless'
    method: 'usb'
    macs:
      - 'AA:BB:CC:DD:EE:02'  # receiver MAC for top-front intake
    role: 'front-top'

  - id: 'llw-front-bottom'
    type: 'lianli-wireless'
    method: 'usb'
    macs:
      - 'AA:BB:CC:DD:EE:03'  # receiver MAC for bottom-front intake
    role: 'front-bottom'

activeProfile: 'default'

profiles:
  default:
    clusters:
      aio:
        curve:
          source: 'cpu'
          curve:
            - tempC: 30
              pwmPercent: 40
            - tempC: 50
              pwmPercent: 60
            - tempC: 70
              pwmPercent: 85
            - tempC: 80
              pwmPercent: 100
        lighting:
          mode: 'effect'
          effect: 'rainbow'
          brightness: 200

      front-top:
        curve:
          source: 'cpu'
          curve:
            - tempC: 30
              pwmPercent: 30
            - tempC: 50
              pwmPercent: 50
            - tempC: 70
              pwmPercent: 80
            - tempC: 80
              pwmPercent: 100
        lighting:
          mode: 'effect'
          effect: 'rainbow'
          brightness: 200

      front-bottom:
        curve:
          source: 'cpu'
          curve:
            - tempC: 30
              pwmPercent: 30
            - tempC: 50
              pwmPercent: 50
            - tempC: 70
              pwmPercent: 80
            - tempC: 80
              pwmPercent: 100
        lighting:
          mode: 'effect'
          effect: 'rainbow'
          brightness: 200

```
---
## Commands (current)
```bash 
openunilink <command> [options]
```

### discover
Discover supported devices
```bash 
openunilink discover
```
Typical output:
```text
Discovered devices:

TYPE              ID        DESCRIPTION
-----------------------------------------------
lianli-wireless   llw-ctrl-1 L-Wireless controller (Lian Li TL/SL ...)
lianli-wireless   llw-ctrl-1-rx-1 Receiver on channel 1 (sl-fan)
lianli-wireless   llw-ctrl-1-rx-2 Receiver on channel 2 (sl-fan)
...

Details:

[lianli-wireless / llw-ctrl-1]
  vendorId: 1046
  productId: 32833
  path: /dev/hidraw3
  manufacturer: Lian Li
  product: Lian Li Wireless Controller
  serialNumber: ...
  seriesHint: sl

[lianli-wireless / llw-ctrl-1-rx-1]
  controllerId: llw-ctrl-1
  mac: AA:BB:CC:DD:EE:01
  masterMac: ...
  channel: 1
  deviceType: sl-fan
...
```

### sensors
Show system temperatures as seen by OpenUniLink.
```bash
openunilink sensors --config /etc/openunilink/config.yaml
```
Typical output:
```text
Sensor readings:
  CPU: 42.5 °C
  GPU: (not available)
```

### status
Show active profile, current temps, and target PWM per cluster based on the configured curves.
```bash
openunilink status --config /etc/openunilink/config.yaml
```
Typical output:
```text
Active profile: default
Temps: CPU=48.3 °C

Clusters:
ROLE           TARGET PWM  CURRENT RPM
--------------------------------------
aio            54.0        (n/a)
front-top      44.0        (n/a)
front-bottom   44.0        (n/a)

```
### deamon
Run the main OpenUniLink daemon. In production, typically started via systemd.
```bash
openunilink daemon --config /etc/openunilink/config.yaml
```
What it does:
- Reads the config
- Creates the sensor provider
- Creates driver instances for each configured cluster
- Enters the main loop:
- Reads temps every daemon.intervalMs
- Computes target PWM for each cluster using its curve
- Calls the driver to apply fan speed and lighting

---

## Installation (development)

> Runtime target: **Linux**  
> Development can be done on Linux or macOS. Hardware control / systemd integration should be tested on Linux.

### Requirements

- Node.js 20+ (for SEA support)
- npm
- `git`
- For Lian Li wireless:
    - L-Wireless controller dongle plugged into your Linux machine
    - Appropriate udev permissions (so the `openunilink` process can access HID devices)

### Clone & install

```bash
git clone https://github.com/your-user/openunilink.git
cd openunilink

npm ci
```

## Disclaimer & Safety Warning

**PLEASE READ CAREFULLY BEFORE USING THIS SOFTWARE.**

### No Warranty
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**Use at your own risk.** Improper usage of fan control software can lead to overheating, hardware throttling, or permanent hardware damage. Always monitor your system temperatures when testing new configurations.

### Affiliation
This project is an independent, community-driven effort. **It is NOT affiliated with, endorsed by, sponsored by, or in any way officially connected with:**

*   **Lian Li Industrial Co., Ltd.**
*   **Corsair Gaming, Inc.**
*   Any other fan, cooler, AIO, or electronic equipment manufacturer.

All product names, logos, and brands are property of their respective owners. All company, product and service names used in this software are for identification purposes only.

## License

This project is licensed under the **LGPL-3.0-or-later** license.
