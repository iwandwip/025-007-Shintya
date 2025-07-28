#!/usr/bin/env python3
"""
MD to PDF Converter
Converts all .md files in current directory to high-quality PDF files
"""

import os
import glob
import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_css_style():
    """Create CSS styling for better PDF output"""
    return """
    @page {
        size: A4;
        margin: 2cm;
        @bottom-center {
            content: counter(page);
            font-size: 10px;
            color: #666;
        }
    }
    
    body {
        font-family: 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: none;
        margin: 0;
        padding: 0;
    }
    
    h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: bold;
    }
    
    h1 {
        font-size: 2.2em;
        border-bottom: 3px solid #3498db;
        padding-bottom: 0.3em;
        page-break-before: auto;
    }
    
    h2 {
        font-size: 1.8em;
        border-bottom: 2px solid #95a5a6;
        padding-bottom: 0.2em;
    }
    
    h3 {
        font-size: 1.4em;
        color: #34495e;
    }
    
    p {
        margin-bottom: 1em;
        text-align: justify;
    }
    
    code {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: 'DejaVu Sans Mono', 'Liberation Mono', Consolas, monospace;
        font-size: 0.9em;
        color: #e74c3c;
    }
    
    pre {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 5px;
        padding: 1em;
        overflow-x: auto;
        margin: 1em 0;
        page-break-inside: avoid;
    }
    
    pre code {
        background: none;
        border: none;
        padding: 0;
        color: #333;
    }
    
    blockquote {
        border-left: 4px solid #3498db;
        margin: 1em 0;
        padding-left: 1em;
        color: #666;
        font-style: italic;
        background-color: #f9f9f9;
        padding: 0.5em 1em;
    }
    
    ul, ol {
        margin: 1em 0;
        padding-left: 2em;
    }
    
    li {
        margin-bottom: 0.5em;
    }
    
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        page-break-inside: avoid;
    }
    
    th, td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
    }
    
    th {
        background-color: #f2f2f2;
        font-weight: bold;
        color: #2c3e50;
    }
    
    tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    
    img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        border: 1px solid #ddd;
        border-radius: 3px;
        page-break-inside: avoid;
    }
    
    a {
        color: #3498db;
        text-decoration: none;
    }
    
    a:hover {
        text-decoration: underline;
    }
    
    hr {
        border: none;
        border-top: 2px solid #eee;
        margin: 2em 0;
    }
    
    .page-break {
        page-break-before: always;
    }
    """

def setup_markdown_extensions():
    """Setup markdown extensions for better parsing"""
    return [
        'markdown.extensions.extra',      # Tables, fenced code blocks, etc.
        'markdown.extensions.codehilite', # Syntax highlighting
        'markdown.extensions.toc',        # Table of contents
        'markdown.extensions.tables',     # Table support
        'markdown.extensions.fenced_code', # Fenced code blocks
        'markdown.extensions.nl2br',      # Newline to <br>
    ]

def convert_md_to_pdf(md_file_path, output_dir="pdf_output"):
    """Convert a single markdown file to PDF"""
    try:
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(exist_ok=True)
        
        # Read markdown file
        with open(md_file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convert markdown to HTML
        md = markdown.Markdown(extensions=setup_markdown_extensions())
        html_content = md.convert(md_content)
        
        # Create complete HTML document
        full_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{Path(md_file_path).stem}</title>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Generate PDF filename
        pdf_filename = Path(md_file_path).stem + '.pdf'
        pdf_path = Path(output_dir) / pdf_filename
        
        # Convert HTML to PDF with custom CSS
        html_doc = HTML(string=full_html)
        css_style = CSS(string=create_css_style())
        
        html_doc.write_pdf(
            pdf_path,
            stylesheets=[css_style],
            optimize_size=('fonts', 'images')
        )
        
        logger.info(f"✅ Converted: {md_file_path} -> {pdf_path}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error converting {md_file_path}: {str(e)}")
        return False

def main():
    """Main function to process all .md files in current directory"""
    print("🚀 MD to PDF Converter Started")
    print("=" * 50)
    
    # Find all .md files in current directory
    current_dir = Path.cwd()
    md_files = list(current_dir.glob("*.md"))
    
    if not md_files:
        print("❌ No .md files found in current directory!")
        return
    
    print(f"📁 Found {len(md_files)} markdown file(s)")
    print(f"📂 Current directory: {current_dir}")
    
    # Create output directory
    output_dir = "pdf_output"
    Path(output_dir).mkdir(exist_ok=True)
    print(f"📄 PDF files will be saved to: {output_dir}/")
    print()
    
    # Convert each file
    successful_conversions = 0
    failed_conversions = 0
    
    for i, md_file in enumerate(md_files, 1):
        print(f"[{i}/{len(md_files)}] Processing: {md_file.name}")
        
        if convert_md_to_pdf(md_file, output_dir):
            successful_conversions += 1
        else:
            failed_conversions += 1
        
        print()
    
    # Summary
    print("=" * 50)
    print("📊 CONVERSION SUMMARY")
    print(f"✅ Successful: {successful_conversions}")
    print(f"❌ Failed: {failed_conversions}")
    print(f"📁 Output directory: {Path(output_dir).absolute()}")
    
    if successful_conversions > 0:
        print(f"\n🎉 {successful_conversions} PDF file(s) created successfully!")
    
    if failed_conversions > 0:
        print(f"\n⚠️  {failed_conversions} file(s) failed to convert. Check the logs above.")

def install_requirements():
    """Helper function to show required packages"""
    requirements = [
        "markdown>=3.4.0",
        "weasyprint>=60.0",
        "Pygments>=2.0.0"  # For syntax highlighting
    ]
    
    print("📦 Required packages:")
    print("pip install " + " ".join(requirements))
    print()

if __name__ == "__main__":
    print("🔧 Checking requirements...")
    
    try:
        import markdown
        import weasyprint
        print("✅ All required packages are installed")
        print()
        main()
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print()
        install_requirements()
        print("Please install the required packages and run again.")