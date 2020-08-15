let http = require('http').createServer(handler);
let fs = require('fs');
let io = require('socket.io')(http);
let robot = require("robotjs");

console.log("[INFO] Libraries loaded.")

http.listen(8000);

function handler(req, res) {
  // always give index.html regardless of the path
  fs.readFile(__dirname + '/public/index.html', (err, data) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data); // write data from index.html
    return res.end();
  });
}

robot.setKeyboardDelay(0);

// input: javascript key event key names (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
// output: robotjs key names (https://robotjs.io/docs/syntax#keyboard)
// keyMapping currently set up for Duck Game controls (https://duckgame.fandom.com/wiki/Controls)
// TODO: proper configuration menu
keyMapping = {
  "w": "up",
  "a": "left",
  "s": "down",
  "d": "right",
  "b": "k",
  "q": "i",
  "c": "l",
  "v": ";",
  "Escape": "+",
  " ": "right_shift",
  "e": "o"
}

console.log("[INFO] Listening ready.")

// concurrent connections have control over separate keypressed state
// but both control the same robot keys
io.sockets.on('connection', socket => {
  let pressed = [];

  function keyDown(key) {
    console.log("v", key, pressed);
    // pun!
    if (key in keyMapping) {
      console.log(keyMapping[key])
      robot.keyToggle(keyMapping[key], "down");
    }
  }

  function keyUp(key) {
    console.log("^", key, pressed);
    if (key in keyMapping) {
      console.log(keyMapping[key])
      robot.keyToggle(keyMapping[key], "up");
    }
  }

  function keyRepeat(key) {
    console.log(".", key, pressed);
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
