#!/usr/bin/env python3
import os
import zipfile
from pathlib import Path

EXCLUDE_FOLDERS = [
    '.claude',
    '.expo',
    '.git',
    '.idea',
    '.next',
    '.nyc_output',
    '__pycache__',
    'android',
    'build',
    'coverage',
    'dist',
    'ignore-this-folder',
    'node_modules',
    'venv',
]

EXCLUDE_FILES = [
    '*.log',
    '*.zip',
    '.DS_Store',
    '.env',
    '.env.local',
    'delete_md_files.py',
    'Thumbs.db',
    'zip_files.py',
]

EXCLUDE_EXTENSIONS = [
    '.md',
]

def should_exclude_folder(path, exclude_folders):
    path_str = str(path)
    for exclude in exclude_folders:
        if exclude in path_str:
            return True
    return False

def should_exclude_file(path, exclude_files, exclude_extensions):
    path_str = str(path)
    file_extension = path.suffix.lower()
    
    if file_extension in exclude_extensions:
        return True
    
    for exclude in exclude_files:
        if exclude.startswith('*'):
            if path_str.endswith(exclude[1:]):
                return True
        elif exclude in path_str:
            return True
    return False

def zip_project(project_path='.', output_name=None):
    project_path = Path(project_path)
    
    if output_name is None:
        folder_name = project_path.resolve().name
        output_name = f"{folder_name}.zip"
    
    with zipfile.ZipFile(output_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if not should_exclude_folder(Path(root) / d, EXCLUDE_FOLDERS)]
            
            for file in files:
                file_path = Path(root) / file
                if not should_exclude_file(file_path, EXCLUDE_FILES, EXCLUDE_EXTENSIONS):
                    arcname = file_path.relative_to(project_path)
                    zipf.write(file_path, arcname)
                    print(f"Added: {arcname}")
    
    print(f"\nProject zipped successfully as '{output_name}'")
    print(f"Archive size: {os.path.getsize(output_name) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    zip_project()
