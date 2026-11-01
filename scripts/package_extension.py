import os
import zipfile
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
dist_dir = root_dir / "extension" / "dist"
output_dir = root_dir / "dist"
output_dir.mkdir(parents=True, exist_ok=True)
zip_path = output_dir / "job-sniper-extension.zip"

print(f"Packaging {dist_dir} into {zip_path}...")

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
    for root, _, files in os.walk(dist_dir):
        for file in files:
            file_path = Path(root) / file
            archive_name = file_path.relative_to(dist_dir)
            zip_file.write(file_path, archive_name)

print(f"Successfully created Chrome Web Store package: {zip_path} ({zip_path.stat().st_size} bytes)")
