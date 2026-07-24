"""
Run this script from your project root:
  python3 step8_requirements_patch.py
"""

with open('requirements.txt', 'r') as f:
    content = f.read()

additions = []
if 'cryptography' not in content:
    additions.append('cryptography==42.0.5')
if 'Flask-Mail' not in content:
    additions.append('Flask-Mail==0.10.0')

if additions:
    with open('requirements.txt', 'a') as f:
        f.write('\n' + '\n'.join(additions) + '\n')
    print("✅ Added to requirements.txt:", additions)
else:
    print("✅ requirements.txt already has all dependencies")
