let http = require('http').createServer(handler);
let fs = require('fs');
let io = require('socket.io')(http);
let robot = require("robotjs");

console.log("[INFO] Libraries loaded.")

http.listen(8000);

const mouseMapping = {
  "#MouseLeft": "left",
  "#MouseMiddle": "middle",
  "#MouseRight": "right",
}
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
  "ShiftRight": "right_shift",
  // No robot.js Mac support
  "PrintScreen": "printscreen",
  // No robot.js Mac support
  "Insert": "insert",
  // audio* excluded since browser cannot generate them
  // lights* excluded since browser cannot generate them
  "Minus": "-",
  "Equal": "=",
  "BracketLeft": "[",
  "BracketRight": "]",
  "Semicolon": ";",
  "Quote": "'",
  "Backquote": "`",
  "Backslash": "\\",
  "Comma": ",",
  "Period": ".",
  "Slash": "/",
  "Space": " ",
  ...mouseMapping,
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
robot.setMouseDelay(0);

console.log("[INFO] Listening ready.")

let basePressedCount = {};
for (let key of Object.keys(keyMapping)) {
  basePressedCount[key] = 0;
}


// concurrent connections have control over same pressed state
// and both control the same robot keys
let totalPressed = {...basePressedCount};
let pressedBySocket = [];
let sockets = []
io.sockets.on('connection', socket => {
  for (let key of Object.keys(totalPressed)) {
    if (totalPressed[key] > 0) {
      socket.emit("keydown", key);
    }
  }
  sockets.push(socket);
  pressedBySocket.push({...basePressedCount})
  for (let s of ["down", "up"]) {
    socket.on('key' + s, key => {
      // check if any other socket is disconnected
      for (let i = sockets.length-1; i >= 0; i--) {
        sock = sockets[i];
        // obviously this socket is not disconnected
        if (sock != socket && sock.disconnected) {
          sockets.splice(i, 1);
          [removed] = pressedBySocket.splice(i, 1);
          for (let key of Object.keys(totalPressed)) {
            totalPressed[key] -= removed[key];
          }
        }
      }
      // apply key
      console.log(s, key);
      if (key in keyMapping) {
        if (s == "up") {
          for (let i = 0; i < sockets.length; i++) {
            if (sockets[i] == socket) {
              if (pressedBySocket[i][key]) {
                pressedBySocket[i][key] = false;
                totalPressed[key] -= 1;
              }
              break;
            }
          }
        }
        if (totalPressed[key] == 0) {
          // note reversed argument order between mouseToggle and keyToggle
          if (key in mouseMapping) {
            robot.mouseToggle(s, mouseMapping[key])
          } else {
            robot.keyToggle(keyMapping[key], s);
          }
          // Tell other clients that this key is pressed/unpressed
          for (let sock of sockets) {
            if (sock != socket) {
              sock.emit('key' + s, key);
            }
          }
        }
        if (s == "down") {
          for (let i = 0; i < sockets.length; i++) {
            if (sockets[i] == socket) {
              if (!pressedBySocket[i][key]) {
                pressedBySocket[i][key] = true;
                totalPressed[key] += 1;
              }
              break;
            }
          }
        }
      }
    });
  }
});
