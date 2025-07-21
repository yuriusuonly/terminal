import {build, createServer, defineConfig, preview} from "vite";
import {Server} from "socket.io";
import {spawn} from "node-pty";

const config = defineConfig({
  root: "source/",
  base: "./",
  publicDir: false,
  envDir: "../",
  css: {
    devSourcemap: true
  },
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: false
    },
    outDir: "../public",
    assetsDir: "./",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      output: {
        assetFileNames: ({name}) => name === "style.css" ? "index.css" : name,
        entryFileNames: "index.js"
      }
    }
  }
});

const io = (server) => {
  server = new Server(server);
  server.on("connection", (socket) => {
    const shell = process.env[process.platform == "win32" ? "COMSPEC" : "SHELL"];
    const terminal = spawn(shell, [], {
      name: "xterm-256color",
      cwd: process.env.HOME,
      env: process.env
    });
    socket.on("input", (data) => terminal.write(data));
    terminal.onData((data) => socket.emit("output", data));
    socket.on("resize", (cols, rows) => terminal.resize(cols, rows));
    terminal.onExit(() => {
      terminal.kill();
      socket.emit("exit");
    });
  });
};

await (async () => {
  if (process.argv.includes("build")) {
    await build(config);
  }
  else if (process.argv.includes("serve")) {
    const server = await preview(config);
    io(server.httpServer);
    server.printUrls();
  }
  else {
    const server = await createServer(config);
    io(server.httpServer);
    await server.listen();
    server.printUrls();
  }
})();
