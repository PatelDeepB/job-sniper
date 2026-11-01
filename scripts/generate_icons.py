from pathlib import Path
from PIL import Image, ImageDraw

icons_dir = Path("extension/icons")
icons_dir.mkdir(parents=True, exist_ok=True)


def draw_icon(size: int) -> Image.Image:
    # 4x supersampling for crisp anti-aliasing
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = int(dim * 0.08)
    # Background circle
    draw.ellipse([margin, margin, dim - margin, dim - margin], fill="#0f172a", outline="#38bdf8", width=int(scale * 1.5))

    center = dim // 2
    radius_outer = int(dim * 0.28)
    radius_inner = int(dim * 0.16)

    # Outer reticle ring
    draw.ellipse(
        [center - radius_outer, center - radius_outer, center + radius_outer, center + radius_outer],
        outline="#38bdf8",
        width=int(scale * 1.2),
    )

    # Crosshair lines
    crosshair_len = int(dim * 0.38)
    line_width = int(scale * 1.2)
    # Horizontal
    draw.line([center - crosshair_len, center, center - radius_inner, center], fill="#38bdf8", width=line_width)
    draw.line([center + radius_inner, center, center + crosshair_len, center], fill="#38bdf8", width=line_width)
    # Vertical
    draw.line([center, center - crosshair_len, center, center - radius_inner], fill="#38bdf8", width=line_width)
    draw.line([center, center + radius_inner, center, center + crosshair_len], fill="#38bdf8", width=line_width)

    # Center target dot
    dot_radius = int(dim * 0.08)
    draw.ellipse(
        [center - dot_radius, center - dot_radius, center + dot_radius, center + dot_radius],
        fill="#ef4444",
        outline="#ffffff",
        width=int(scale * 0.8),
    )

    return img.resize((size, size), Image.Resampling.LANCZOS)


for target_size in [16, 48, 128]:
    icon = draw_icon(target_size)
    icon_path = icons_dir / f"icon{target_size}.png"
    icon.save(icon_path, "PNG")
