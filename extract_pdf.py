from pypdf import PdfReader
import sys

pdf_path = "e:/desktop/Restoloop/Antigravity_skills.pdf"
output_path = "e:/desktop/Restoloop/Antigravity_skills.txt"

try:
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
        
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_text)
    print(f"Text extracted to {output_path}")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
