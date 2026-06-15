# Issue 364 Llama 4 405B Audit Process

This process audits the Atlas graph record `model:llama-4-405b-instruct@current`
against official Llama 4 release surfaces, then removes or corrects unsupported
graph facts.

1. Read issue #364 directly from GitHub.
2. Fetch official Meta and Hugging Face Llama 4 source snapshots at run time.
3. Audit the repo for every Llama 4 405B graph reference.
4. Implement the smallest graph correction: remove unsupported 405B facts and
   keep the public Scout and Maverick records wired into the Llama 4 family.
5. Verify no unsupported 405B graph references remain.
6. Run metadata and Atlas build gates.
7. Summarize the final diff for review.
