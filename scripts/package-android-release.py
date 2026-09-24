import zipfile
import os

out_dir = 'public/downloads'
os.makedirs(out_dir, exist_ok=True)
zip_path = os.path.join(out_dir, 'ZZ_KHATA_Android_Release_Project.zip')

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('android'):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            zipf.write(full_path, rel_path)

print(f"Android release package generated successfully at {zip_path}")
