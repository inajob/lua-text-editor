let input;
let log;
let keydownHandler;
let charHandler;

function setupCanvas(){
 input = document.createElement("input")
  input.className = "hidden-input"
  document.body.appendChild(input)
  input.addEventListener("compositionend", (e) => {
    console.log(e)
    log.appendChild(document.createTextNode("compositionend: " + e.data))
  })
  input.addEventListener("keypress", (e) => {
    console.log("keypress", e.key)
    log.appendChild(document.createTextNode("keypress: " + e.keyCode + "," + e.code))
    if(e.key.length == 1){
      console.log("charHandler", e.key)
      charHandler(e.key)
      input.value = ""
      e.preventDefault()
      return
    }
  });
  input.addEventListener("keydown", (e) => {
    console.log("keydown", e, e.key)
    log.appendChild(document.createTextNode("keydown: " + e.keyCode + "," + e.code))
    if(e.key.length == 1){
      return
    }
    if(e.keyCode != 13 && e.code == "Enter"){ // ime enter
      console.log(e, input.value)
      const text = input.value
      setTimeout(() => { // delete input value after insert japanese text(workaround)
        input.value = ""
      },1);
      e.preventDefault()
      for(let i = 0; i < text.length; i ++){
        charHandler(text[i]);
      }
      return
    }
    if(e.keyCode != 229){
      keydownHandler(e.code)
    }
  });


  const canvas = document.createElement("canvas")
  canvas.width = 320
  canvas.height = 240
  document.body.appendChild(canvas)
  canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    console.log(x, y, e)
    //focus(e.clientX, e.clientY);
    e.preventDefault();
  })

  log = document.createElement("div")
  document.body.appendChild(log)

  return canvas;
}


function focus(x, y){
  input.style.left = x + "px"
  input.style.top = y + "px"
  input.style.width = (320-x) + "px"
  input.focus();
}

(async function(){

const { LuaFactory } = require('wasmoon')

// Initialize a new lua environment factory
// You can pass the wasm location as the first argument, useful if you are using wasmoon on a web environment and want to host the file by yourself
const factory = new LuaFactory()
// Create a standalone lua environment from the factory
const lua = await factory.createEngine()
const canvas = setupCanvas()
const ctx = canvas.getContext("2d")
//try {
    // Set a JS function to be a global lua function
    lua.global.set('sum', (x, y) => x + y)
    lua.global.set('text', (s, x, y) => {
      ctx.textBaseline = "top"
      ctx.font = "12px sans-serif";
      ctx.fillText(s, x, y)
    })
    lua.global.set('fillrect', (x, y, w, h) => {
      ctx.fillRect(x, y, w, h)
    })
    lua.global.set('setcursor', (x, y) => {
      console.log("setcursor", x, y)
      focus(canvas.offsetLeft + x, canvas.offsetTop + y)
    })
    lua.global.set('setcolor', (s) => {
      ctx.fillStyle = s
    })



    // Run a lua string
    await lua.doString(`
    lines = {""}
    row = 1
    col = 1

    function draw()
      setcolor("white")
      fillrect(0, 0, 320, 240)
      setcolor("green")
      fillrect(0, (row + 1) * 12, 320, 1)
      setcolor("black")
      margin = 10
      for i, line in pairs(lines) do
        x = 0
        n = 1
        for p, cc in utf8.codes(line) do
          c = utf8.char(cc)
          text(c, margin + x, i * 12)
          if i == row and n == col then
            setcursor(margin + x, row * 12)
          end
          if cc > 255 then
            x = x + 12
          else
            x = x + 8
          end
          
          n = n + 1
        end
        if col == n then
          setcursor(margin + x, row * 12)
        end
      end
      setcolor("green")
      fillrect(0, 240 - 12, 320, 12)
      setcolor("white")
      text("col:" .. col .. " ,row:" .. row, 12, 240 - 12)
    end
    function insertChar(s, c, i)
      newLine = ""
      count = 0
      hit = false
      for p, lc in utf8.codes(s) do
        if count == i - 1 then
          newLine = newLine .. c
          hit = true
        end
        newLine = newLine .. utf8.char(lc)
        count = count + 1
      end
      if not(hit) then
        newLine = newLine .. c
      end
      return newLine
    end

    function removeChar(s, i)
      newLine = ""
      count = 1
      for p, lc in utf8.codes(s) do
        if count ~= i then
          newLine = newLine .. utf8.char(lc)
        end
        count = count + 1
      end
      return newLine
    end

    function charHandler(c)
      lines[row] = insertChar(lines[row], c, col)
      col = col + 1
      draw()
    end
    function keydownHandler(s)
      if s == "ArrowDown" then
        if row < #lines then
          row = row + 1
          if col >= utf8.len(lines[row]) then
            col = utf8.len(lines[row]) + 1
          end
          draw()
        end
      elseif s == "ArrowUp" then
        if row > 1 then
          row = row - 1
          if col >= utf8.len(lines[row]) then
            col = utf8.len(lines[row]) + 1
          end
          draw()
        end
      elseif s == "ArrowLeft" then
        if col == 1 then
          if row > 1 then
            row = row - 1
            col = utf8.len(lines[row]) + 1
          end
        else
          col = col - 1
        end
        draw()
      elseif s == "ArrowRight" then
        if col == utf8.len(lines[row]) + 1 and row < #lines then
          col = 1
          row = row + 1
        else
          if col <= utf8.len(lines[row]) then
            col = col + 1
          end
        end
        draw()
      elseif s == "Enter" then
        newLine = ""
        newLineNext = ""
        count = 1
        for p, lc in utf8.codes(lines[row]) do
          if count < col then
            newLine = newLine .. utf8.char(lc)
          else
            newLineNext = newLineNext .. utf8.char(lc)
          end
          count = count + 1
        end
        lines[row] = newLine
        table.insert(lines, row + 1, "")
        row = row + 1
        lines[row] = newLineNext
        -- if row - topRow > lastRow - 2 then
        --  topRow = topRow + 1
        -- end
        col = 1

        draw()
      elseif s == "Backspace" then
        if col == 1 then
          if row > 1 then
            -- merge line
            nowLine = lines[row]
            table.remove(lines, row)
            row = row - 1
            col = utf8.len(lines[row]) + 1
            lines[row] = lines[row] .. nowLine
          end
        else
          col = col - 1
          lines[row] = removeChar(lines[row], col)
        end
        draw()
      end
    end
    `)
    keydownHandler = lua.global.get("keydownHandler")
    charHandler = lua.global.get("charHandler")
    setTimeout(() => {
      const draw = lua.global.get('draw')
      draw()
      console.log("draw")
    }, 100)
//} finally {
    // Close the lua environment, so it can be freed
    //lua.global.close()
//}
})()
