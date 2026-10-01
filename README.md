# Formal in Silico — programme site

Public site for the Formal in Silico programme: the charter (programme) and the
implementation progress, in English (`/`) and Chinese (`/zh/`). It contains no
source code.

```
index.html          Programme (English)
progress.html       Progress overview: ledger, goals, phases (English)
dft.html            mini-DFT, goal G1 against DFTK.jl
fem.html            mini-FEM, goal G2 against scikit-fem
md.html             mini-MD v0 against ASE
calphad.html        mini-CALPHAD, goal G3 against pycalphad
zh/…                The same six pages in Chinese
assets/style.css    Shared styles (light and dark)
assets/site.js      Theme toggle and table-of-contents highlight
assets/chart.js     Line charts on the MD and CALPHAD pages (data inline in each page)
```

Plain static HTML, no build step. To publish with GitHub Pages: Settings → Pages →
Deploy from a branch → `main`, folder `/ (root)`.

Content is maintained from the main project's charter, trust ledger, domain
specifications and parity trackers; every progress and domain page carries the
snapshot date it reflects. Update the English and Chinese pages together, and
keep the overview's per-domain numbers in step with the domain pages.

Every page's footer also shows when the page last changed ("updated …"). Before
publishing, run `python3 scripts/stamp_site.py` in the main project: pages edited
since the last commit get the current time, the others the time of the last commit
that changed their content. `--check` only reports pages whose stamp is out of date.
