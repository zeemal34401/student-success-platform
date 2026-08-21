"""Upscale and tag print assets at 300 DPI for large-format posters."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DST = ROOT / "docs" / "print-assets"
TMP = Path(r"C:\Users\Admin\AppData\Local\Temp\cursor\screenshots\docs\print-assets")
ASSETS = Path(r"C:\Users\Admin\.cursor\projects\c-Users-Admin-Desktop-student-success-platform\assets")

DST.mkdir(parents=True, exist_ok=True)

# Ensure latest screenshots/diagrams are in docs/print-assets
copies = {
    TMP / "04-login-interface.png": DST / "04-login-interface.png",
    TMP / "05-faculty-dashboard.png": DST / "05-faculty-dashboard.png",
    TMP / "06-student-profile-rag.png": DST / "06-student-profile-rag.png",
    ASSETS / "architecture-diagram.png": DST / "01-system-architecture.png",
    ASSETS / "workflow-diagram.png": DST / "02-ai-workflow.png",
    ASSETS / "key-results-panel.png": DST / "03-key-results.png",
}
for src, dst in copies.items():
    if src.exists():
        dst.write_bytes(src.read_bytes())
        print(f"copied {src.name} -> {dst.name}")
    else:
        print(f"skip missing {src}")

TARGET_W = 3840
for path in sorted(DST.glob("*.png")):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if w < TARGET_W:
        scale = TARGET_W / w
        im = im.resize((TARGET_W, max(1, int(h * scale))), Image.Resampling.LANCZOS)
    im.save(path, "PNG", dpi=(300, 300), optimize=True)
    print(f"{path.name}: {w}x{h} -> {im.size[0]}x{im.size[1]}")

# Captions file for exhibition / report use
captions = """PrognosEd — Print Asset Captions
================================

01-system-architecture.png
  Layered system architecture: Presentation (React SPA), Application (Express + SQLite),
  AI & Analytics (four ML microservices), and Knowledge (TF-IDF RAG + student chat memory).

02-ai-workflow.png
  End-to-end AI workflow from student metrics to risk prediction, intervention ranking,
  faculty action, and continuous RAG advising with a recommendation feedback loop.

03-key-results.png
  Key model and platform capabilities: early-warning AUC ~0.83, dropout accuracy 94.1%,
  skill recommender Precision@5 100%, and multi-role institutional intelligence.

04-login-interface.png
  Live prototype screenshot — role-based secure sign-in (Faculty demo session).

05-faculty-dashboard.png
  Live prototype screenshot — Faculty Dashboard with KPIs, engagement trend, and at-risk panel.

06-student-profile-rag.png
  Live prototype screenshot — Critical-risk student profile with ML predictions,
  personalized interventions, and RAG advising chat.
"""
(DST / "CAPTIONS.txt").write_text(captions, encoding="utf-8")
print("Wrote CAPTIONS.txt")
