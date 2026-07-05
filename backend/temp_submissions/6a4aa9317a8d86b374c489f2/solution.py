import sys
s = sys.stdin.read().strip()
if s == s[::-1]:
    print("true")
else:
    print("false")
