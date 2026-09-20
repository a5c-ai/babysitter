#!/usr/bin/env python3
"""Compile TeX when requested and record command/version/output truthfully."""
import argparse, json, shutil, subprocess, sys
from pathlib import Path

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("artifact"); ap.add_argument("--policy",choices=["required","optional","off"],required=True); ap.add_argument("--unavailable",choices=["fail","breakpoint","report"],required=True); ap.add_argument("--manifest",required=True); a=ap.parse_args()
    artifact=Path(a.artifact).resolve(); engine=shutil.which("pdflatex")
    m={"gateId":"tex-compile","policy":a.policy,"unavailablePolicy":a.unavailable,"artifact":str(artifact),"engine":engine,"status":"unavailable"}
    code=0
    if a.policy=="off": m["status"]="not-required"
    elif not engine:
        m["reason"]="pdflatex not installed"
        if a.policy=="required" or a.unavailable in {"fail","breakpoint"}: code=1
    else:
        ver=subprocess.run([engine,"--version"],capture_output=True,text=True,encoding="utf-8",errors="replace")
        command=[engine,"-interaction=nonstopmode","-halt-on-error","-file-line-error",artifact.name]
        run=subprocess.run(command,cwd=artifact.parent,capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=120)
        m.update({"engineVersion":ver.stdout.splitlines()[0] if ver.stdout else "unknown","command":command,"exitCode":run.returncode,"stdout":run.stdout,"stderr":run.stderr,"status":"pass" if run.returncode==0 else "fail"})
        code=0 if run.returncode==0 else 1
    Path(a.manifest).write_text(json.dumps(m,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps(m,sort_keys=True)); return code
if __name__=="__main__": raise SystemExit(main())
