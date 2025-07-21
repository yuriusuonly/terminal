import "./icon-512x512.png";

import {Terminal} from "@xterm/xterm";
import {FitAddon} from "@xterm/addon-fit";
import {WebLinksAddon} from "@xterm/addon-web-links";
import {WebglAddon} from "@xterm/addon-webgl";
import {io} from "socket.io-client";

const terminal = new Terminal({
  scrollback: 999999,
  cursorBlink: true
});
const fitAddon = new FitAddon();
const webLinksAddon = new WebLinksAddon();
const webglAddon = new WebglAddon();

terminal.loadAddon(fitAddon);
terminal.loadAddon(webLinksAddon);
terminal.loadAddon(webglAddon);
terminal.open(document.body);
terminal.focus();

const socket = io(location.origin.replace(/http(s?)/, "ws$1"));
terminal.onData((data) => socket.emit("input", data));
socket.on("output", (data) => terminal.write(data));
socket.on("exit", () => {
  alert("Session has ended.");
  location.reload();
});

window.addEventListener("resize", (function resize() {
  const {cols, rows} = fitAddon.proposeDimensions();
  socket.emit("resize", cols, rows);
  fitAddon.fit();
  return resize;
})());
