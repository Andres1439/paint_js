// CONSTANTS

const MODES = {
  DRAW: "draw",
  ERASE: "erase",
  RECTANGLE: "rectangle",
  ELLIPSE: "ellipse",
  PICKER: "picker",
};

// UTILITIES

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ELEMENTS

const $canvas = $("#canvas");
const ctx = $canvas.getContext("2d");
const $colorPicker = $("#color-picker");

const $clearBtn = $("#clear-btn");
const $drawBtn = $("#draw-btn");
const $rectangleBtn = $("#rectangle-btn");
const $ellipseBtn = $("#ellipse-btn");
const $pickerBtn = $("#picker-btn");
const $eraseBtn = $("#erase-btn");

// STATE
let isDrawing = false;
let isShiftPressed = false;
let startX, startY;
let lastX = 0;
let lastY = 0;
let mode = MODES.DRAW;
let imageData;

// EVENTS

$canvas.addEventListener("mousedown", startDrawing);
$canvas.addEventListener("mousemove", draw);
$canvas.addEventListener("mouseup", stopDrawing);
$canvas.addEventListener("mouseleave", stopDrawing);

$colorPicker.addEventListener("change", handleChangeColor);

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

$clearBtn.addEventListener("click", ClearCanvas);
$drawBtn.addEventListener("click", () => setMode(MODES.DRAW));
$rectangleBtn.addEventListener("click", () => setMode(MODES.RECTANGLE));
$ellipseBtn.addEventListener("click", () => setMode(MODES.ELLIPSE));
$pickerBtn.addEventListener("click", () => setMode(MODES.PICKER));
$eraseBtn.addEventListener("click", () => setMode(MODES.ERASE));

// METHODS

function startDrawing(e) {
  isDrawing = true;

  const { offsetX, offsetY } = e;
  // Guardar las coordenadas iniciales

  [startX, startY] = [offsetX, offsetY];
  [lastX, lastY] = [offsetX, offsetY];

  imageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);
}

function draw(e) {
  if (!isDrawing) return;

  const { offsetX, offsetY } = e;

  if (mode === MODES.DRAW || mode === MODES.ERASE) {
    // Comenzar un trazado
    ctx.beginPath();
    // Mover el trazado a las coordenadas actuales
    ctx.moveTo(lastX, lastY);
    // Dibujar el trazado a las coordenadas actuales y nuevas
    ctx.lineTo(e.offsetX, e.offsetY);
    // Guardar las coordenadas actuales
    ctx.stroke();

    // Actualizar las ultimas coordenadas utilizadas
    [lastX, lastY] = [offsetX, offsetY];

    return;
  }

  if (mode === MODES.RECTANGLE) {
    ctx.putImageData(imageData, 0, 0);
    // startx -> coordenada inicial del click
    // offsetX -> posicion donde se encuentra el raton
    let width = offsetX - startX;
    let height = offsetY - startY;

    if (isShiftPressed) {
      const sideLength = Math.min(Math.abs(width), Math.abs(height));

      width = width > 0 ? sideLength : -sideLength;
      height = height > 0 ? sideLength : -sideLength;
    }

    ctx.beginPath();
    ctx.strokeRect(startX, startY, width, height);
    ctx.stroke();
    return;
  }
}

function stopDrawing() {
  isDrawing = false;
}

function handleChangeColor() {
  const { value } = $colorPicker;
  ctx.strokeStyle = value;
}

function ClearCanvas() {
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
}

function handleKeyDown({ key }) {
  isShiftPressed = key === "Shift";
  return;
}

function handleKeyUp({ key }) {
  if (key === "Shift") {
    isShiftPressed = false;
  }
}

// DRAWING MODES

async function setMode(newMode) {
  let previousMode = mode;
  mode = newMode;

  // Para limpiar el boton activo actual
  $("button.active")?.classList.remove("active");

  if (mode === MODES.DRAW) {
    $drawBtn.classList.add("active");
    ctx.globalCompositeOperation = "source-over"; //DIBUJES ENCIMA POR CUALQUIER COSA

    canvas.style.cursor = "default";
    ctx.lineWidth = 2;
    return;
  }

  if (mode === MODES.RECTANGLE) {
    $rectangleBtn.classList.add("active");
    ctx.globalCompositeOperation = "source-over"; //DIBUJES ENCIMA POR CUALQUIER COSA

    canvas.style.cursor = "crosshair";
    ctx.lineWidth = 2;
  }

  if (mode === MODES.ERASE) {
    $eraseBtn.classList.add("active");
    canvas.style.cursor = "url('./cursors/erase.png') 0 24, auto";
    ctx.globalCompositeOperation = "destination-out"; // PARA ESCRIBIR POR ENCIMA, ELMINANDO LO QUE ESTA POR ABAJO
    ctx.lineWidth = 20;

    return;
  }

  if (mode === MODES.PICKER) {
    $pickerBtn.classList.add("active");
    const EyeDropper = new window.EyeDropper();
    try {
      const result = await EyeDropper.open();
      const { sRGBHex } = result;
      ctx.strokeStyle = sRGBHex;
      $colorPicker.value = sRGBHex;
      setMode(previousMode);
    } catch (e) {}
    return;
  }

  if (mode === MODES.ELLIPSE) {
    $ellipseBtn.classList.add("active");
  }
}

// INIT
setMode(MODES.DRAW);

// Si es que lo soporta el navegador, se visualizará, si no entonces se olcultara
if (typeof window.EyeDropper !== "undefined") {
  $pickerBtn.removeAttribute("disabled");
}
