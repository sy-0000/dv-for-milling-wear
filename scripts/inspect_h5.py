"""Print the full structure of one or more .h5 files: groups, datasets, shape, dtype, attrs, basic stats.

Usage: python scripts/inspect_h5.py data/raw/M1T1R1C11VB3.h5 [more files...]
Read-only; never modifies the files.
"""
import sys

import h5py
import numpy as np


def show(path):
    print(f"\n=== {path}")
    with h5py.File(path, "r") as f:
        if f.attrs:
            print("root attrs:", dict(f.attrs))

        def visit(name, obj):
            if isinstance(obj, h5py.Group):
                print(f"[group] {name}  attrs={dict(obj.attrs)}")
                return
            a = obj[()]
            line = f"  {name:45s} shape={obj.shape} dtype={obj.dtype}"
            if obj.attrs:
                line += f" attrs={ {k: (v.decode() if isinstance(v, bytes) else v) for k, v in obj.attrs.items()} }"
            if np.issubdtype(obj.dtype, np.number) and a.size > 1:
                line += f"\n{'':47s} min={a.min():.4g} max={a.max():.4g} mean={a.mean():.4g} std={a.std():.4g} nan={np.isnan(a).sum()}"
            elif a.size == 1:
                line += f" value={a}"
            print(line)

        f.visititems(visit)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        show(p)
