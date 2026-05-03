
def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    brackets = 0
    parens = 0
    
    for char in content:
        if char == '{': braces += 1
        elif char == '}': braces -= 1
        elif char == '[': brackets += 1
        elif char == ']': brackets -= 1
        elif char == '(': parens += 1
        elif char == ')': parens -= 1
        
        if braces < 0 or brackets < 0 or parens < 0:
            print(f"Negative balance: braces={braces}, brackets={brackets}, parens={parens}")
            # return
            
    print(f"Final balance: braces={braces}, brackets={brackets}, parens={parens}")

check_balance('frontend/src/pages/VolunteerDashboard.jsx')
