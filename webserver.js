let http = require('http').createServer(handler);
let fs = require('fs');
let io = require('socket.io')(http);
let robot = require("robotjs");

console.log("[INFO] Libraries loaded.")

http.listen(8000);

// input: javascript key event.code (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values)
// output: robotjs key names (https://robotjs.io/docs/syntax#keyboard)
let keyMapping = {
  "Backspace": "backspace",
  "Delete": "delete",
  "Enter": "enter",
  "Tab": "tab",
  "Escape": "escape",
  "ArrowUp": "up",
  "ArrowLeft": "left",
  "ArrowDown": "down",
  "ArrowRight": "right",
  "Home": "home",
  "End": "end",
  "PageUp": "pageup",
  "PageDown": "pagedown",
  // "command" excluded since browser cannot generate it
  "AltLeft": "alt",
  "AltRight": "alt",
  "ControlLeft": "control",
  "ControlRight": "control",
  "ShiftLeft": "shift",
  "ShiftRight": "shift_right",
  // No robot.js Mac support
  "PrintScreen": "printscreen",
  // No robot.js Mac support
  "Insert": "insert",
  // audio* excluded since browser cannot generate them
  // lights* excluded since browser cannot generate them
  "Minus": "-",
  "Equal": "=",
  "BracketLeft": "]",
  "BracketRight": "[",
  "Semicolon": ";",
  "Quote": "'",
  "Backquote": "`",
  "Backslash": "\\",
  "Comma": ",",
  "Period": ".",
  "Slash": "/",
  "Space": " ",
}
// Letter keys
for (let c = 0; c < 26; c++) {
  keyMapping["Key" + String.fromCharCode(65 + c)] = String.fromCharCode(97 + c);
}
for (let i = 0; i < 10; i++) {
  // Digit keys
  keyMapping["Digit" + i] = "" + i;
  // Numpad keys (No robot.js linux support)
  keyMapping["Numpad" + i] = "numpad_" + i;
}
for (let i = 1; i <= 12; i++) {
  // Fn keys
  keyMapping["F" + i] = "f" + i;
}

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
