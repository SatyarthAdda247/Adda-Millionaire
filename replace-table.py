#!/usr/bin/env python3
import re

# Read the original file
with open('frontend/src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Read the new card section
with open('card-section.txt', 'r') as f:
    new_section = f.read()

# Find and replace the table section
# Pattern: from ") : (" to the closing of Table "</Table>\n              </div>\n            )}"
pattern = r'(\) : \(\s*<div className="overflow-x-auto">.*?</Table>\s*</div>\s*\)\})'

replacement = new_section.rstrip()

# Use DOTALL flag to make . match newlines
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back
with open('frontend/src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

print("✅ Successfully replaced table with card layout!")
