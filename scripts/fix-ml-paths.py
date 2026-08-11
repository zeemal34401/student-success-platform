"""Fix hardcoded developer paths in ML pipeline Python files."""
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "ml")
PATH_KEYS = {
    "MODELS_DIR",
    "OUTPUTS_DIR",
    "OULAD_BASE",
    "STUDENT_BASE",
    "XAPI_PATH",
    "DATA_PATH",
}


def patch_file(path: str) -> bool:
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()

    if not any("farah" in line for line in lines):
        return False

    imported: set[str] = set()
    new_lines: list[str] = []

    for line in lines:
        if "farah" in line and "=" in line:
            key = line.split("=")[0].strip()
            if key in PATH_KEYS:
                imported.add(key)
                continue
        new_lines.append(line)

    if imported:
        insert_at = 0
        for i, line in enumerate(new_lines):
            if line.startswith("import ") or line.startswith("from "):
                insert_at = i + 1
        import_line = f"from paths import {', '.join(sorted(imported))}"
        if import_line not in new_lines:
            new_lines.insert(insert_at, import_line)

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(new_lines) + "\n")
    return True


def main() -> None:
    count = 0
    for dirpath, _, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith(".py") or fn == "paths.py":
                continue
            path = os.path.join(dirpath, fn)
            if patch_file(path):
                count += 1
                print(f"patched {path}")
    print(f"total patched: {count}")


if __name__ == "__main__":
    main()
