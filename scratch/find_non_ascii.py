
import sys

with open('frontend/src/pages/VolunteerDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.splitlines()):
    for char in line:
        if ord(char) > 127:
            print(f"Line {i+1}, char {repr(char)} (code {ord(char)})")
