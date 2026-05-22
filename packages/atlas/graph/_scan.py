import os, json, glob, re, sys
os.chdir(r'C:/work/v6/graph')
patterns = ['**/pass-*.yaml','**/wave_*.yaml','**/phase-*.yaml','**/batch-*.yaml','**/round-*.yaml','**/iteration-*.yaml']
files = []
for pat in patterns:
    files.extend(glob.glob(pat, recursive=True))
extra = [f for f in glob.glob('**/*.yaml', recursive=True) if re.search(r'(?i)(^|[/\\])pass[0-9]', f)]
files = sorted(set(files+extra))
entries = []
for f in files:
    full = os.path.abspath(f).replace('\\', '/')
    sz = os.path.getsize(f)
    with open(f, 'r', encoding='utf-8', errors='replace') as fh:
        text = fh.read()
    docs = re.split(r'(?m)^---\s*$', text)
    docs = [d for d in docs if d.strip()]
    nks = set()
    ids = []
    for d in docs:
        m = re.search(r'(?m)^nodeKind:\s*(\S+)', d)
        if m: nks.add(m.group(1))
        idm = re.search(r'(?m)^id:\s*(\S+)', d)
        if idm: ids.append(idm.group(1))
    entries.append({
        'file': full,
        'sizeBytes': sz,
        'nodeKinds': sorted(nks),
        'totalDocsInFile': len(docs),
        'idsSampled': ids[:30],
    })
print(json.dumps({'entries': entries}, indent=2))

