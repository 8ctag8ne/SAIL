import opendataloader_pdf
import tempfile
import json

from fpdf import FPDF

# create a dummy pdf
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=15)
pdf.cell(200, 10, txt="Welcome to opendataloader", ln=1, align='C')
pdf_path = "test.pdf"
pdf.output(pdf_path)

out_dir = tempfile.mkdtemp()
opendataloader_pdf.convert(
    input_path=[pdf_path],
    output_dir=out_dir,
    format="json"
)

import os
json_path = os.path.join(out_dir, "test.json")
with open(json_path) as f:
    data = json.load(f)

print("Type of data:", type(data))
if isinstance(data, dict):
    print("Keys in dict:", data.keys())
    for k, v in data.items():
        print(f"Key {k} type: {type(v)}")

