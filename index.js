const canvas = document.getElementById("stereogramCanvas");
const ctx = canvas.getContext("2d");
const resetButton = document.getElementById("resetButton");
const clearButton = document.getElementById("clearButton");
const removeImageButton = document.getElementById("removeImageButton");
const brushSizeInput = document.getElementById("brushSize");
const brushShapeSelect = document.getElementById("brushShape");
const depthValueInput = document.getElementById("depthValue");
const imageUpload = document.getElementById("imageUpload");

let width = canvas.width;
let height = canvas.height;

const patternWidth = 100; // Width of the repeating pattern
let depthMap = createEmptyDepthMap(width, height);
let pattern = createPattern(patternWidth, height);
let isDrawing = false;
let uploadedImagePattern = null;
let useUploadedPattern = false;

canvas.addEventListener("mousedown", () => {
	isDrawing = true;
});
canvas.addEventListener("mouseup", () => {
	isDrawing = false;
});
canvas.addEventListener("mouseleave", () => {
	isDrawing = false;
});
canvas.addEventListener("mousemove", drawOnDepthMap);

window.addEventListener("resize", resizeCanvas);

resetButton.addEventListener("click", () => {
	depthMap = createEmptyDepthMap(width, height); // Clear the depth map on reset
	pattern = useUploadedPattern
		? uploadedImagePattern
		: createPattern(patternWidth, height);
	drawStereogram(depthMap, pattern);
});

clearButton.addEventListener("click", () => {
	clearDepthMap();
	drawStereogram(depthMap, pattern);
});

removeImageButton.addEventListener("click", () => {
	useUploadedPattern = false;
	pattern = createPattern(patternWidth, height);
	drawStereogram(depthMap, pattern);
});

imageUpload.addEventListener("change", handleImageUpload);

// Initial generation
resizeCanvas();

function resizeCanvas() {
	width = window.innerWidth;
	height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
	depthMap = createEmptyDepthMap(width, height);
	pattern = useUploadedPattern
		? uploadedImagePattern
		: createPattern(patternWidth, height);
	drawStereogram(depthMap, pattern);
}

function createEmptyDepthMap(width, height) {
	const map = new Array(height);
	for (let y = 0; y < height; y++) {
		map[y] = new Array(width).fill(0);
	}
	return map;
}

function clearDepthMap() {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			depthMap[y][x] = 0;
		}
	}
}

function drawOnDepthMap(event) {
	if (!isDrawing) return;

	const rect = canvas.getBoundingClientRect();
	const x = Math.floor(event.clientX - rect.left);
	const y = Math.floor(event.clientY - rect.top);

	const brushSize = parseInt(brushSizeInput.value, 10);
	const brushShape = brushShapeSelect.value;
	const depthValue = parseInt(depthValueInput.value, 10);

	for (let dy = -brushSize; dy <= brushSize; dy++) {
		for (let dx = -brushSize; dx <= brushSize; dx++) {
			const newX = x + dx;
			const newY = y + dy;
			if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
				if (brushShape === "circle") {
					if (dx * dx + dy * dy <= brushSize * brushSize) {
						depthMap[newY][newX] = depthValue;
					}
				} else if (brushShape === "square") {
					depthMap[newY][newX] = depthValue;
				}
			}
		}
	}
	pattern = useUploadedPattern
		? uploadedImagePattern
		: createPattern(patternWidth, height);
	drawStereogram(depthMap, pattern);
}

function createPattern(patternWidth, height) {
	const pattern = new Array(height);
	for (let y = 0; y < height; y++) {
		pattern[y] = new Array(patternWidth);
		for (let x = 0; x < patternWidth; x++) {
			// Creating a colorful pattern
			const r = Math.floor(Math.random() * 256);
			const g = Math.floor(Math.random() * 256);
			const b = Math.floor(Math.random() * 256);
			pattern[y][x] = { r, g, b };
		}
	}
	return pattern;
}

function handleImageUpload(event) {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (e) {
		const img = new Image();
		img.onload = function () {
			uploadedImagePattern = createPatternFromImage(img);
			useUploadedPattern = true;
			drawStereogram(depthMap, uploadedImagePattern);
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(file);
}

function createPatternFromImage(img) {
	const imgCanvas = document.createElement("canvas");
	const imgCtx = imgCanvas.getContext("2d");
	imgCanvas.width = img.width;
	imgCanvas.height = img.height;
	imgCtx.drawImage(img, 0, 0);
	const imgData = imgCtx.getImageData(0, 0, img.width, img.height).data;

	const pattern = new Array(height);
	for (let y = 0; y < height; y++) {
		pattern[y] = new Array(patternWidth);
		for (let x = 0; x < patternWidth; x++) {
			const imgX = (x + Math.floor(Math.random() * img.width)) % img.width;
			const imgY = (y + Math.floor(Math.random() * img.height)) % img.height;
			const index = (imgY * img.width + imgX) * 4;
			const r = imgData[index];
			const g = imgData[index + 1];
			const b = imgData[index + 2];
			pattern[y][x] = { r, g, b };
		}
	}
	return pattern;
}

function drawStereogram(depthMap, pattern) {
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const depth = depthMap[y][x];
			// Ensure patternX stays within valid range
			const patternX =
				(((x - depth) % patternWidth) + patternWidth) % patternWidth;
			// Ensure patternY stays within valid range
			const patternY = y % pattern.length;
			const color = pattern[patternY][patternX];

			if (color) {
				const index = (y * width + x) * 4;
				data[index] = color.r; // Red
				data[index + 1] = color.g; // Green
				data[index + 2] = color.b; // Blue
				data[index + 3] = 255; // Alpha
			}
		}
	}

	ctx.putImageData(imageData, 0, 0);
}
