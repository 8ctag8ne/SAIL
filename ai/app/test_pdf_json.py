import opendataloader_pdf
import tempfile
import json
import os

pdf_path = "document.pdf"
# I can just pass a dummy string because opendataloader_pdf will probably fail but the structure of its error or a small valid string
try:
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=15)
    pdf.cell(200, 10, txt="Welcome", ln=1, align='C')
    pdf.output(pdf_path)
except ImportError:
    pass

out_dir = tempfile.mkdtemp()
opendataloader_pdf.convert(
    input_path=[pdf_path],
    output_dir=out_dir,
    format="json"
)

json_path = os.path.join(out_dir, "document.json")
with open(json_path) as f:
    data = json.load(f)

print("Type of data:", type(data))
if isinstance(data, dict):
    print("Keys in dict:", data.keys())
    # print one item of each key if it is list
    for k, v in data.items():
        if isinstance(v, list) and len(v) > 0:
            print(f"Key {k} item 0 type:", type(v[0]))
            print(f"Key {k} item 0:", v[0])
