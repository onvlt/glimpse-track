# glimpse-stopwatch

A stopwatch applet for the [Glimpse](https://alex-oleshkevich.github.io/glimpse) desktop panel.
It shows the elapsed time on the bar and a popover to control the stopwatch and keep records.

- Start, pause, resume and reset; the time is live on the indicator while running
- Records with a description — type one in the entry row and submit to add a record
- Stopwatch state is persistendc accross restarts

## Installation

### NixOS

This applet comes with `flake.nix`. You can either install it into nix profile or add it to your flake inputs.

```sh
nix profile add github:onvlt/glimpse-stopwatch
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
left = ["lt.nyv.glimpse-stopwatch"]
```

Applet should automatically start after saving the config file.
