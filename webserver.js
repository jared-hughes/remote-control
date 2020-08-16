let http = require('http').createServer(handler);
let fs = require('fs');
let io = require('socket.io')(http);
let robot = require("robotjs");

console.log("[INFO] Libraries loaded.")

http.listen(8000);

// JS key names when they are the same in robot.js
let permittedKeys = [' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~']
  + [""]
// input: javascript key event key names (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
// output: robotjs key names (https://robotjs.io/docs/syntax#keyboard)
// keyMapping currently set up for Duck Game controls (https://duckgame.fandom.com/wiki/Controls)
// TODO: proper configuration menu
let keyMapping = {
  "ArrowUp": "up",
  "ArrowLeft": "left",
  "ArrowDown": "down",
  "ArrowRight": "right",
  "Escape": "escape",
  "Shift": "shift",
}
for (let key of permittedKeys) {
  keyMapping[key] = key;
}
permittedKeys = Object.keys(keyMapping);

function handler(req, res) {
  // always give index.html regardless of the path
  fs.readFile(__dirname + '/public/index.html', (err, data) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data); // write data from index.html
    return res.end();
  });
}

robot.setKeyboardDelay(0);

console.log("[INFO] Listening ready.")

// concurrent connections have control over separate keypressed state
// but both control the same robot keys
io.sockets.on('connection', socket => {
  let pressed = [];

  function keyDown(key) {
    // pun!
    if (key in keyMapping) {
      robot.keyToggle(keyMapping[key], "down");
    }
  }

  function keyUp(key) {
    if (key in keyMapping) {
      robot.keyToggle(keyMapping[key], "up");
    }
  }

  function keyRepeat(key) {
    // ignore for now
  }

  socket.on('keydown', key => {
    pressed.push(key);
    keyDown(key);
  });

  socket.on('keyrepeat', key => {
    keyRepeat(key)
  })

  socket.on('keyup', key => {
    pressed.splice(pressed.indexOf(key), 1)
    keyUp(key);
  });
});
