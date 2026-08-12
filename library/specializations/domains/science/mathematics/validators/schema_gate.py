#!/usr/bin/env python3
"""Small Draft 2020-12 subset used by this package; fail on unsupported keywords."""
import json,re
from pathlib import Path
SUPPORTED={'$schema','$id','title','type','additionalProperties','required','properties','$defs','$ref','items','pattern','minLength','minimum','maximum','enum','const','allOf','if','then','minItems','uniqueItems','description'}
def validate(instance,schema_path):
 root=json.loads(Path(schema_path).read_text(encoding='utf-8'));errors=[]
 def walk(v,s,p):
  unknown=set(s)-SUPPORTED
  if unknown: errors.append(f'{p}: unsupported schema keywords {sorted(unknown)}')
  if '$ref' in s:
   t=root
   for part in s['$ref'].removeprefix('#/').split('/'): t=t[part.replace('~1','/').replace('~0','~')]
   walk(v,t,p);return
  if 'allOf' in s:
   for x in s['allOf']: walk(v,x,p)
  if 'if' in s and matches(v,s['if']) and 'then' in s: walk(v,s['then'],p)
  typ=s.get('type');ok={'object':lambda:isinstance(v,dict),'array':lambda:isinstance(v,list),'string':lambda:isinstance(v,str),'integer':lambda:isinstance(v,int) and not isinstance(v,bool),'boolean':lambda:isinstance(v,bool)}
  if typ in ok and not ok[typ](): errors.append(f'{p}: expected {typ}');return
  if 'enum' in s and v not in s['enum']: errors.append(f'{p}: not in enum')
  if 'const' in s and v!=s['const']: errors.append(f'{p}: not const')
  if isinstance(v,str):
   if len(v)<s.get('minLength',0): errors.append(f'{p}: too short')
   if 'pattern' in s and not re.fullmatch(s['pattern'],v): errors.append(f'{p}: pattern mismatch')
  if isinstance(v,int) and not isinstance(v,bool):
   if v<s.get('minimum',v): errors.append(f'{p}: below minimum')
   if v>s.get('maximum',v): errors.append(f'{p}: above maximum')
  if isinstance(v,list):
   if len(v)<s.get('minItems',0): errors.append(f'{p}: too few items')
   if s.get('uniqueItems') and len({json.dumps(x,sort_keys=True) for x in v})!=len(v): errors.append(f'{p}: duplicate items')
   if 'items' in s:
    for i,x in enumerate(v): walk(x,s['items'],f'{p}[{i}]')
  if isinstance(v,dict):
   for k in s.get('required',[]):
    if k not in v: errors.append(f'{p}: missing {k}')
   props=s.get('properties',{})
   if s.get('additionalProperties') is False:
    for k in set(v)-set(props): errors.append(f'{p}: unknown property {k}')
   for k,x in v.items():
    if k in props: walk(x,props[k],f'{p}.{k}')
 def matches(v,s):
  probe=[];before=errors;local=[]
  # Only package conditionals use properties/const. Evaluate without mutating errors.
  if not isinstance(v,dict): return False
  for k,sub in s.get('properties',{}).items():
   if k not in v: continue
   if 'const' in sub and v[k]!=sub['const']: return False
   if 'pattern' in sub and (not isinstance(v[k],str) or not re.search(sub['pattern'],v[k])): return False
  return True
 walk(instance,root,'$');return errors
