from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "birthday source"
TARGET = ROOT / "happyBirthdaySouth" / "assets"
CHARACTERS = TARGET / "characters"


def is_edge_background(pixel):
    r, g, b, alpha = pixel
    if alpha < 12:
        return True
    spread = max(r, g, b) - min(r, g, b)
    white_or_gray = r >= 222 and g >= 222 and b >= 222 and spread <= 42
    peach_floor = r >= 210 and 155 <= g <= 220 and 125 <= b <= 205 and r > g + 18 and g > b + 8
    return white_or_gray or peach_floor


def cut_character(source_path, target_path):
    image = Image.open(source_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    seen = bytearray(width * height)
    background = bytearray(width * height)
    queue = deque()

    def enqueue(x, y):
        idx = y * width + x
        if seen[idx]:
            return
        seen[idx] = 1
        if is_edge_background(pixels[x, y]):
            background[idx] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or nx >= width or ny < 0 or ny >= height:
                continue
            idx = ny * width + nx
            if seen[idx]:
                continue
            seen[idx] = 1
            if is_edge_background(pixels[nx, ny]):
                background[idx] = 1
                queue.append((nx, ny))

    bg_mask = Image.frombytes("L", image.size, bytes(255 if v else 0 for v in background))
    alpha = Image.eval(bg_mask.filter(ImageFilter.GaussianBlur(0.7)), lambda value: 255 - value)
    image.putalpha(alpha)

    bbox = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
    if bbox:
        pad = 10
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(width, bbox[2] + pad)
        bottom = min(height, bbox[3] + pad)
        image = image.crop((left, top, right, bottom))

    max_side = 420
    scale = min(1, max_side / max(image.size))
    if scale < 1:
        next_size = (round(image.width * scale), round(image.height * scale))
        image = image.resize(next_size, Image.Resampling.LANCZOS)

    image.save(target_path, optimize=True)


def crop_transparent_image(source_path, target_path):
    image = Image.open(source_path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox:
        pad = 16
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(image.width, bbox[2] + pad)
        bottom = min(image.height, bbox[3] + pad)
        image = image.crop((left, top, right, bottom))
    image.save(target_path, optimize=True)


def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    CHARACTERS.mkdir(parents=True, exist_ok=True)

    for filename in ("background.png", "letter.txt"):
        data = (SOURCE / filename).read_bytes()
        (TARGET / filename).write_bytes(data)

    crop_transparent_image(SOURCE / "cake.png", TARGET / "cake.png")

    for index in range(1, 13):
        cut_character(SOURCE / f"{index}.png", CHARACTERS / f"{index}.png")


if __name__ == "__main__":
    main()
