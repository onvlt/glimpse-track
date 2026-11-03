# glimpse-track

Simple time tracker applet for the [Glimpse](https://alex-oleshkevich.github.io/glimpse) desktop panel. It allows tracking time spent on various tasks and keeps record of spent times. It displays live elapsed time on current task in the panel.

## Features

- [x] Integrated stopwatch
- [x] Manage time records
    - [x] Save record
    - [x] Delete record
    - [ ] Rename record
    - [ ] Add color codes to records
    - [ ] Export records
    - [ ] Clear all records
    - [ ] Resume record

## Installation

### NixOS

This applet comes with `flake.nix`. You can either install it into nix profile or add it to your flake inputs.

```sh
nix profile add github:onvlt/glimpse-track
```

### Build from source

```sh
npm install
just install
```

## Configuration

Add the applet id to a zone of a panel in `~/.config/glimpse/panel.toml`:

```toml
[[panels]]
left = ["lt.nyv.glimpse-track"]
```

Applet should automatically start after saving the config file.
