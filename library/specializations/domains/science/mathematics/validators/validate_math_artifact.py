#!/usr/bin/env python3
"""Conservative LaTeX lexer for UTF-8, structure and semantic reference checks."""
import argparse,json,re,sys
from pathlib import Path
THEOREM={"theorem","lemma","proposition","corollary","claim","definition"}; COMMANDS={"ref","eqref","autoref"}
def strip_comments(text):
 out=[]
 for line in text.splitlines():
  i=0; buf=[]
  while i<len(line):
   if line[i]=="%" and (i==0 or len(re.match(r".*?(\\*)$","".join(buf)).group(1))%2==0): break
   buf.append(line[i]); i+=1
  out.append("".join(buf))
 return "\n".join(out)
def tokens(text):
 i=0; result=[]
 while i<len(text):
  if text[i]!="\\": i+=1; continue
  start=i; i+=1
  if i>=len(text): break
  if not text[i].isalpha(): i+=1; continue
  j=i
  while j<len(text) and text[j].isalpha(): j+=1
  name=text[i:j]; i=j
  if i<len(text) and text[i]=="*": name+="*"; i+=1
  while i<len(text) and text[i].isspace(): i+=1
  args=[]
  while i<len(text) and text[i]=="{":
   depth=1; j=i+1
   while j<len(text) and depth:
    if text[j]=="{" and text[j-1]!="\\": depth+=1
    elif text[j]=="}" and text[j-1]!="\\": depth-=1
    j+=1
   if depth: break
   args.append(text[i+1:j-1]); i=j
   while i<len(text) and text[i].isspace(): i+=1
  result.append((start,name,args))
 return result
def main():
 ap=argparse.ArgumentParser(); ap.add_argument("artifact"); ap.add_argument("--bib",action="append",default=[]); ap.add_argument("--required-section",action="append",default=[]); ap.add_argument("--manifest"); a=ap.parse_args(); errors=[]; p=Path(a.artifact)
 try: text=p.read_bytes().decode("utf-8",errors="strict")
 except Exception as exc: print(f"ERROR: cannot read strict UTF-8 artifact: {exc}",file=sys.stderr); return 2
 if not text.strip(): errors.append("artifact is empty")
 if "�" in text: errors.append("artifact contains U+FFFD")
 text=strip_comments(text); ts=tokens(text)
 sections=[args[0] for _,name,args in ts if name.rstrip("*") in {"part","chapter","section","subsection","subsubsection"} and args]
 for req in a.required_section:
  if not any(req.casefold() in s.casefold() for s in sections): errors.append(f"missing required section matching {req!r}")
 env=[]; labels={}; refs=[]; citations=[]
 for pos,name,args in ts:
  if name=="begin" and args: env.append((args[0],pos))
  elif name=="end" and args:
   if not env or env[-1][0]!=args[0]: errors.append(f"unbalanced environment end {args[0]} at offset {pos}")
   else: env.pop()
  elif name=="label" and args:
   key=args[0]
   if key in labels: errors.append(f"duplicate label {key}")
   labels[key]={"environment":env[-1][0] if env else None,"offset":pos}
  elif name in COMMANDS and args: refs.append((name,args[0]))
  elif name=="cite" and args: citations.extend(x.strip() for x in args[-1].split(","))
 for e,pos in env: errors.append(f"unclosed environment {e} at offset {pos}")
 # Brace balance ignores escaped braces and comments but includes command arguments.
 depth=0
 for i,ch in enumerate(text):
  escaped=i>0 and len(re.search(r"(\\*)$",text[:i]).group(1))%2==1
  if ch=="{" and not escaped: depth+=1
  elif ch=="}" and not escaped:
   depth-=1
   if depth<0: errors.append(f"closing brace without opener at offset {i}"); depth=0
 if depth: errors.append(f"unbalanced braces: depth {depth}")
 prefixes={"thm":"theorem","lem":"lemma","prop":"proposition","cor":"corollary","def":"definition"}
 for command,key in refs:
  if key not in labels: errors.append(f"undefined reference {key}"); continue
  envname=labels[key]["environment"]; base=envname[:-1] if envname and envname.endswith("*") else envname
  if envname and envname.endswith("*") and base in THEOREM: errors.append(f"numeric reference {key} targets starred theorem-like environment {envname}")
  expected=prefixes.get(key.split(":",1)[0])
  if expected and base!=expected: errors.append(f"reference target kind mismatch for {key}: expected {expected}, found {envname}")
 bib=set()
 for bp in a.bib:
  try: bib.update(re.findall(r"@\w+\s*\{\s*([^,\s]+)",Path(bp).read_text(encoding="utf-8",errors="strict")))
  except Exception as exc: errors.append(f"cannot read bibliography {bp}: {exc}")
 if citations and not a.bib: errors.append("citations present but no bibliography supplied")
 for key in citations:
  if key not in bib: errors.append(f"undefined citation {key}")
 manifest={"status":"fail" if errors else "pass","artifact":str(p),"labels":len(labels),"references":len(refs),"citations":len(citations),"findings":[{"gate":"static-latex","severity":"error","message":e} for e in errors],"claim":"static artifact validation only; not mathematical proof verification"}
 if a.manifest: Path(a.manifest).write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n",encoding="utf-8")
 if errors:
  for e in errors: print(f"ERROR: {e}",file=sys.stderr)
  return 1
 print(json.dumps(manifest,sort_keys=True)); return 0
if __name__=="__main__": raise SystemExit(main())
