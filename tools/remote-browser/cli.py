#!/usr/bin/env python3
"""CLI for the Remote Browser Bridge (agent-side helper).
Usage: python3 cli.py <command> [args]
Commands: status, nav <url>, click <x> <y> [left|right], dblclick <x> <y>, move <x> <y>,
          wheel <x> <y> <dx> <dy>, key <key> [down|up] [mods], type <text>,
          press <combo like ctrl+s>, eval <expr>, dom <selector> [limit],
          axtree [limit], shot, reload, frame
"""
import sys, json, urllib.request, os

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = 'http://127.0.0.1:8080'
TOKEN = open(os.path.join(HERE, 'token.txt')).read().strip()

def api(path, data=None, timeout=60):
    req = urllib.request.Request(f'{BASE}{path}?t={TOKEN}',
                                 data=json.dumps(data).encode() if data is not None else None,
                                 headers={'content-type': 'application/json'},
                                 method='POST' if data is not None else 'GET')
    return urllib.request.urlopen(req, timeout=timeout).read().decode()

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if cmd == 'status':
        print(api('/api/status'))
    elif cmd == 'nav':
        print(api('/api/navigate', {'url': sys.argv[2]}))
    elif cmd == 'reload':
        print(api('/api/reload', {'ignoreCache': True}))
    elif cmd == 'click':
        btn = sys.argv[3] if len(sys.argv) > 3 else 'left'
        x, y = float(sys.argv[1]), float(sys.argv[2])
        api('/api/input', {'kind': 'mouse', 'type': 'moved', 'x': x, 'y': y})
        api('/api/input', {'kind': 'mouse', 'type': 'pressed', 'x': x, 'y': y, 'button': btn, 'clickCount': 1})
        print(api('/api/input', {'kind': 'mouse', 'type': 'released', 'x': x, 'y': y, 'button': btn, 'clickCount': 1}))
    elif cmd == 'dblclick':
        x, y = float(sys.argv[1]), float(sys.argv[2])
        api('/api/input', {'kind': 'mouse', 'type': 'moved', 'x': x, 'y': y})
        api('/api/input', {'kind': 'mouse', 'type': 'pressed', 'x': x, 'y': y, 'button': 'left', 'clickCount': 2})
        print(api('/api/input', {'kind': 'mouse', 'type': 'released', 'x': x, 'y': y, 'button': 'left', 'clickCount': 2}))
    elif cmd == 'move':
        print(api('/api/input', {'kind': 'mouse', 'type': 'moved', 'x': float(sys.argv[1]), 'y': float(sys.argv[2])}))
    elif cmd == 'wheel':
        print(api('/api/input', {'kind': 'mouse', 'type': 'wheel', 'x': float(sys.argv[1]), 'y': float(sys.argv[2]), 'deltaX': float(sys.argv[3]), 'deltaY': float(sys.argv[4])}))
    elif cmd == 'key':
        key = sys.argv[2]; typ = sys.argv[3] if len(sys.argv) > 3 else 'down'
        mods = int(sys.argv[4]) if len(sys.argv) > 4 else 0
        print(api('/api/input', {'kind': 'key', 'type': typ, 'key': key, 'modifiers': mods}))
    elif cmd == 'press':
        parts = sys.argv[2].lower().split('+')
        mods = 0
        for p in parts[:-1]:
            mods |= {'ctrl': 2, 'shift': 8, 'alt': 1, 'meta': 4}.get(p, 0)
        k = parts[-1]
        api('/api/input', {'kind': 'key', 'type': 'down', 'key': k, 'modifiers': mods})
        print(api('/api/input', {'kind': 'key', 'type': 'up', 'key': k, 'modifiers': mods}))
    elif cmd == 'type':
        for ch in sys.argv[2]:
            api('/api/input', {'kind': 'key', 'type': 'down', 'key': ch})
            api('/api/input', {'kind': 'key', 'type': 'up', 'key': ch})
        print('typed', len(sys.argv[2]), 'chars')
    elif cmd == 'eval':
        print(api('/api/eval', {'expression': sys.argv[2]}))
    elif cmd == 'dom':
        sel = sys.argv[2] if len(sys.argv) > 2 else 'button, a, input'
        lim = int(sys.argv[3]) if len(sys.argv) > 3 else 40
        print(api('/api/dom', {'selector': sel, 'limit': lim}))
    elif cmd == 'axtree':
        print(api('/api/axtree', {'limit': sys.argv[2] if len(sys.argv) > 2 else '150'}))
    elif cmd == 'shot':
        print(api('/api/shot', {}))
    elif cmd == 'frame':
        import subprocess
        out = os.path.join(HERE, 'last-frame.jpg')
        subprocess.run(['curl', '-s', f'{BASE}/frame.jpg', '-o', out])
        print('saved', out)
    else:
        print(__doc__)

if __name__ == '__main__':
    main()
