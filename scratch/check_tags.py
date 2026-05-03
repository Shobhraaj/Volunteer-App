
import re

def check_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        # Very simple tag extractor
        tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)>', line)
        for open_tag, close_tag in tags:
            if open_tag:
                if open_tag in ['img', 'br', 'hr', 'input', 'link', 'meta', 'circle', 'path', 'svg', 'span', 'div', 'button', 'table', 'thead', 'tr', 'th', 'tbody', 'td', 'h1', 'h3', 'p', 'Link', 'StatCard', 'ConfirmDialog', 'ActivityStatus', 'TabButton', 'EmptyState', 'Trophy', 'CheckCircle', 'Award', 'BarChart3', 'BrainCircuit', 'List', 'FileText', 'MapPin']:
                    # Note: this is a very naive check because of self-closing tags and components
                    if '/>' not in line[line.find('<'+open_tag):]:
                        stack.append((open_tag, i+1))
            elif close_tag:
                if stack and stack[-1][0] == close_tag:
                    stack.pop()
                else:
                    print(f"Mismatch: found </{close_tag}> but expected something else at line {i+1}")
    
    for tag, line in stack:
        print(f"Unclosed tag: <{tag}> at line {line}")

check_tags('frontend/src/pages/VolunteerDashboard.jsx')
