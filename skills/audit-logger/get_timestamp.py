#!/usr/bin/env python3
"""
Get current timestamp in the format required for audit logs.
Returns: YYYY-MM-DD HH:MM:SS (24-hour format)
"""
from datetime import datetime

if __name__ == "__main__":
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(timestamp)
