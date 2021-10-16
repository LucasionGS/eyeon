#!/usr/bin/env node

import SI from "systeminformation";
import realine from "readline";
// @ts-expect-error
import keypress from "keypress";
import Bytes from "./Bytes";
import os from "os";

const args = process.argv.slice(2);

const app = new class App {
  delayMs = parseInt(args[0]) || 2000;
  stdout = process.stdout;
  stdin = process.stdin;
  width: number;
  height: number;
  headerHeight = 2;
  cursor: {
    x: number;
    y: number;
  };

  write(buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean {
    return this.stdout.write(buffer, cb);
  }
  setCursor(x: number | null, y?: number | null) {
    x ??= this.cursor.x;
    y ??= this.cursor.y;

    if (x < 0) {
      x = 0;
    } else if (x > this.width) {
      x = this.width;
    }
    if (y < 0) {
      y = 0;
    } else if (y > this.height) {
      y = this.height;
    }

    this.cursor.x = x;
    this.cursor.y = y;

    this.stdout.write(`\x1b[${y};${x + 1}H`);
  }

  resetCursor() {
    app.write("\x1B[0f");
    this.cursor = { x: 0, y: 0 };
  }

  moveCursor(x: number, y: number) {
    this.setCursor(this.cursor.x + x, this.cursor.y + y);
  }
}

const RED = "\x1B[31m";
const GREEN = "\x1B[32m";
const YELLOW = "\x1B[33m";
const BLUE = "\x1B[34m";
const PINK = "\x1B[35m";

const REDBACKGROUND = "\x1B[47m\x1B[41m";
const GREENBACKGROUND = "\x1B[47m\x1B[42m";
const YELLOWBACKGROUND = "\x1B[47m\x1B[43m";
const BLUEBACKGROUND = "\x1B[47m\x1B[44m";
const PINKBACKGROUND = "\x1B[47m\x1B[45m";

interface KeyPress {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  sequence: string;
}

keypress(app.stdin);
app.stdin.setRawMode(true);
app.stdin.resume();

app.stdin.on("keypress", (ch: Buffer, key: KeyPress) => {
  // console.log(key);'
  if (key) {
    if (key.ctrl && key.name == "c") {
      app.write("\x1B[2J");
      process.exit();
    }
    if (key.name == "r") {
      init();
    }
  }
});

// make cursor invisible
app.write("\x1B[?25l");
let ints: { [key: string]: any } = {};
init(); // Start app

function colorTemp(temp: number, endColor = "\x1B[0m") {
  if (temp < 40) {
    return GREEN + Math.round(temp) + "°C" + endColor;
  } else if (temp < 60) {
    return YELLOW + Math.round(temp) + "°C" + endColor;
  } else {
    return RED + Math.round(temp) + "°C" + endColor;
  }
}

function colorPercent(percent: number, endColor = "\x1B[0m") {
  if (percent < 50) {
    return GREEN + percent?.toFixed(2) + "%" + endColor;
  } else if (percent < 80) {
    return YELLOW + percent?.toFixed(2) + "%" + endColor;
  } else {
    return RED + percent?.toFixed(2) + "%" + endColor;
  }
}

function drawPercentLine(percent: number, width: number = 12) {
  // const x = 0;
  // const y = app.headerHeight + 1;
  let line = "[";
  for (let i = 0; i < (width - 2); i++) {
    if (i < percent / 100 * (width - 2)) {
      line += GREEN + "▇";
    } else {
      line += " ";
    }
  }
  return line + "\x1B[0m]";
}

async function init() {
  [app.width, app.height] = app.stdout.getWindowSize();
  // Clear screen
  app.write("\x1B[2J");
  // Move cursor to top left
  app.resetCursor();
  drawHeader("Eyeon");
  if (ints["header"] === undefined) ints["header"] = setInterval(() => drawHeader("Eyeon"), 1000);
  drawBox("left", () => 0, async () => {
    const currentLoad = await SI.currentLoad();
    const cpuTemp = await SI.cpuTemperature();
    const mem = await SI.mem();
    const processes = await SI.processes();
    const cpuExtraIndent = cpuTemp.cores.length.toString().length;
    return [
      `CPU:${" ".repeat(6 + cpuExtraIndent)}${drawPercentLine(currentLoad.currentLoad)} ${colorTemp(cpuTemp.main)} | ${colorPercent(currentLoad.currentLoad) ?? "Loading..."}`,
      currentLoad.cpus.map((cpu, i) => `${`Core #${i}:${" ".repeat(cpuExtraIndent)}${drawPercentLine(cpu.load)} ${cpuTemp.cores[i] ? colorTemp(cpuTemp.cores[i]) + " | " : ""}${colorPercent(cpu.load)}`}`),
      "",
      `Top Processes CPU Usage`,
      processes.list.sort((a, b) => b.cpuu - a.cpuu).map((p) => `${colorPercent(p.cpuu)} ${p.command}`).slice(0, 4),
      "",
      `Memory:`,
      [
        `${Bytes.fromBytes(mem.active).toString(2)}/${Bytes.fromBytes(mem.total).toString(2)} (${Bytes.fromBytes(mem.available).toString(2)} available)`
      ],
      "",
      `Top Processes Memory Usage`,
      processes.list.sort((a, b) => b.mem - a.mem).map((p) => `${colorPercent(p.mem)} ${p.command}`).slice(0, 4),
    ];
  });
  // await new Promise(resolve => setTimeout(resolve, app.delayMs / 2));
  drawBox("right", () => app.width / 2, async () => {
    const fsSize = await SI.fsSize();
    return [
      `Disks:`,
      // ...diskInfo,
      fsSize.map(fs => [
        `${fs.mount}: ${colorPercent(100 / (fs.size / fs.used))} used`,
        [
          `${Bytes.fromBytes(fs.size).toString(2)}`,
          `${Bytes.fromBytes(fs.used).toString(2)} used`,
          `${Bytes.fromBytes(fs.available).toString(2)} available`,
        ]
      ]),
      "",
    ];
  });
}

function drawHeader(text?: string) {
  text ??= "Eyeon";
  // Draw in the center
  const x = Math.floor((app.width - text.length) / 2);
  const y = 0;
  app.setCursor(x, y);
  app.write(`\x1B[1m${text}\x1B[0m`);
  // Draw a line with green background color
  app.setCursor(0, app.headerHeight);
  let headerLineText = ` Server: ${os.hostname()} (${os.type()}) | Uptime: ${new Date(+SI.time().uptime * 1000).toTimeString().split(" ").shift()}`;
  headerLineText += " ".repeat(app.width - headerLineText.length);
  app.write(`${PINK}` + headerLineText + `\x1B[0m\n`);
}

type ContentCallbackType = ContentCallbackType[] | string;
type ContentCallback = () => Promise<ContentCallbackType[]> | ContentCallbackType[];

async function drawBox(id: string, calculateStartX: () => number, contentCallback: ContentCallback) {
  const x = Math.floor(typeof calculateStartX === "function" ? calculateStartX() : 0);
  const y = 3; // Start at line 3
  app.setCursor(x, y);

  // Make box half the screen width
  const boxWidth = Math.floor(app.width / 2);
  const boxHeight = app.height - y - app.headerHeight;
  app.write(`${PINK}╔` + "═".repeat(boxWidth - 2) + "╗\x1B[0m");
  app.setCursor(x, y + 1);
  for (let i = 0; i < boxHeight; i++) {
    app.write(`${PINK}║\x1B[0m` + ` `.repeat(boxWidth - 2) + `${PINK}║\x1B[0m`);
    app.setCursor(x, y + i + 1);
  }
  app.write(`${PINK}╚` + "═".repeat(boxWidth - 2) + "╝\x1B[0m");

  drawBoxContent();
  if (ints[id] === undefined) ints[id] = setInterval(drawBoxContent, app.delayMs);
  let leftContentScrollIndex = 0;
  async function drawBoxContent() {
    const x = Math.floor(typeof calculateStartX === "function" ? calculateStartX() : 0);
    const y = 4; // Start at line 3
    const boxWidth = Math.floor(app.width / 2);
    const boxHeight = app.height - y - app.headerHeight;
    app.resetCursor();
    const padding = 1;

    function flatDeep(arr: ContentCallbackType[], d = 1, indent = 0): string[] {
      return (d > 0 ? arr.reduce((acc, val) => acc.concat((Array.isArray(val) ? flatDeep(val, d - 1, indent + 1) : "  ".repeat(indent) + val) as any), [])
        : arr.slice()) as any[];
    };

    let text = flatDeep(await contentCallback(), Infinity).map(t => t.padEnd(boxWidth - 4 - (padding * 2), " "));
    // const textExtraPadding: number[] = [];
    text = text.map((t, i) => {
      const extraPadding = t.match(/\x1B\[\d+m/g)?.map(m => m.length).reduce((acc, val) => acc + val, 0) ?? 0;
      t = t.slice(0, boxWidth - 8 - (padding * 2) + extraPadding);
      return t;
    })

    for (let i = 0; i < (boxHeight - 2); i++) {
      const t = text[i + leftContentScrollIndex] ?? " ".repeat(boxWidth - 4 - (padding * 2));
      app.setCursor(x + 2 + padding, y + padding + i);
      app.write(`\x1B[1m${t}\x1B[0m`);
    }

    leftContentScrollIndex++;

    if (leftContentScrollIndex >= text.length - (boxHeight - 2)) {
      leftContentScrollIndex = 0;
    }
  }
}

// On screen resize
app.stdout.on("resize", () => {
  init();
});

// on node exit
process.on("exit", () => {
  app.write("\x1B[2J");
  app.resetCursor();
  // make cursor visible
  app.write("\x1B[?25h");
});