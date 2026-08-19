# Terminal Commands Reference

All commands are run from the `age_prediction_pipeline` directory unless
noted otherwise. Windows (`cmd`/PowerShell) syntax is used for paths (`\`);
swap to `/` and `source venv/bin/activate` on macOS/Linux.

See [README.md](README.md) for the full walkthrough and [HOW_IT_WORKS.md](HOW_IT_WORKS.md)
for the conceptual explanation of each pipeline step.

## 1. Environment setup

```bash
python -m venv venv
venv\Scripts\activate
```

**GPU (CUDA 12.8 wheels)** — install before the rest of `requirements.txt`:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt
```

**CPU only:**

```bash
pip install -r requirements.txt
```

Verify GPU is picked up:

```bash
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

Download the MediaPipe face-landmark model (needed for alignment/inference):

```bash
curl -L -o models\face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

**Fix (Windows N/KN editions only)** if `import cv2` fails with a DLL load error:

```bash
pip uninstall opencv-contrib-python -y
pip install opencv-python-headless
```

## 2. Pipeline scripts (`src/`)

### Step 1 — Build the label manifest

```bash
python src\build_manifest.py --narrow-root "D:\NPN\20-50\20-50" --full-root "D:\NPN\age_prediction_up\age_prediction" --out data\manifest.csv
```

| Flag | Default | Purpose |
|---|---|---|
| `--narrow-root` | `D:\NPN\20-50\20-50` | Root of the ages-20-50 dataset |
| `--full-root` | `D:\NPN\age_prediction_up\age_prediction` | Root of the ages-1-100 dataset |
| `--out` | `data\manifest.csv` | Output manifest CSV |
| `--hash-for-dedup` | off | Use content hashing (slower, exact) instead of filename matching to find cross-dataset duplicates |

### Step 2 — Align faces

```bash
python src\align_faces.py --manifest data\manifest.csv --aligned-dir aligned --out data\manifest_aligned.csv
```

Quick test on a subset first:

```bash
python src\align_faces.py --manifest data\manifest.csv --aligned-dir aligned --out data\manifest_aligned_sample.csv --limit 1000
```

| Flag | Default | Purpose |
|---|---|---|
| `--manifest` | `data\manifest.csv` | Input manifest from step 1 |
| `--aligned-dir` | `aligned` | Output folder for aligned 128x128 images |
| `--out` | `data\manifest_aligned.csv` | Output manifest with `aligned_path`/`alignment_ok` columns |
| `--limit N` | `0` (all) | Only process the first N rows |
| `--force-realign` | off | Reprocess images even if an aligned copy already exists |

Resumable — re-running skips images that already have an aligned output on disk.

### Step 3 — Train

```bash
python src\train.py --manifest data\manifest_aligned.csv --epochs 30 --out-dir runs\exp1
```

| Flag | Default | Purpose |
|---|---|---|
| `--manifest` | `data\manifest_aligned.csv` | Aligned manifest from step 2 |
| `--dataset-scope` | `combined` | `full`, `narrow`, or `combined` |
| `--drop-failed-alignment` | off | Exclude rows where alignment failed |
| `--backbone` | `resnet18` | `resnet18`, `resnet50`, `efficientnet_b0`, `mobilenet_v2` |
| `--img-size` | `128` | Input image size |
| `--batch-size` | `64` | |
| `--epochs` | `30` | |
| `--lr` | `1e-4` | |
| `--class-loss-weight` | `0.5` | Weight on classification loss (regression gets `1 - this`) |
| `--patience` | `5` | Early-stopping patience in epochs |
| `--num-workers` | `4` | DataLoader workers |
| `--out-dir` | `runs\exp1` | Where checkpoints/logs are written |
| `--resume` | off | Resume from `<out-dir>\last_checkpoint.pt` |

To compare backbones, train each into its own `--out-dir`:

```bash
python src\train.py --manifest data\manifest_aligned.csv --backbone resnet18 --out-dir runs\resnet18
python src\train.py --manifest data\manifest_aligned.csv --backbone resnet50 --out-dir runs\resnet50
```

### Step 4 — Evaluate (single run)

```bash
python src\evaluate.py --checkpoint runs\exp1\best_model.pt --test-split runs\exp1\test_split.csv
```

| Flag | Default | Purpose |
|---|---|---|
| `--checkpoint` | `runs\resnet50\best_model.pt` | Trained checkpoint to evaluate |
| `--test-split` | `runs\resnet50\test_split.csv` | Held-out test rows saved by `train.py` |
| `--batch-size` | `64` | |

Writes `summary_metrics.csv`, `comparison_report.csv`, `predicted_vs_actual.png` into the checkpoint's directory.

### Step 5 (optional) — Evaluate every run at once

```bash
python src\evaluate_all.py --runs-root runs
```

or explicit run dirs:

```bash
python src\evaluate_all.py --run-dirs runs\resnet18 runs\resnet50 runs\efficientnet_b0
```

| Flag | Default | Purpose |
|---|---|---|
| `--runs-root` | `runs` | Auto-discover run subfolders here (used when `--run-dirs` omitted) |
| `--run-dirs` | — | Explicit list of run dirs, each with `best_model.pt` + `test_split.csv` |
| `--labels` | folder names | Display names, same order as `--run-dirs` |
| `--batch-size` | `64` | |
| `--out` | `data\all_models_comparison.csv` | Combined comparison table |

### Step 6 (optional) — Compare already-evaluated backbones

```bash
python src\compare_backbones.py --run-dirs runs\resnet18 runs\resnet50 runs\efficientnet_b0 --out data\backbone_comparison.csv
```

| Flag | Default | Purpose |
|---|---|---|
| `--run-dirs` | *(required)* | Two or more run dirs, each already evaluated |
| `--labels` | folder names | Display names, same order as `--run-dirs` |
| `--out` | `data\backbone_comparison.csv` | Combined comparison table |

### Step 7 — Predict on a single image

```bash
python src\predict.py --image "C:\path\to\face.jpg"
```

Blend specific checkpoints instead of the default ensemble:

```bash
python src\predict.py --image "C:\path\to\face.jpg" --checkpoints runs\resnet50\best_model.pt runs\efficientnet_b0\best_model.pt
```

| Flag | Default | Purpose |
|---|---|---|
| `--image` | *(required)* | Path to the face photo |
| `--checkpoints` | `resnet50`, `efficientnet_b0`, `mobilenet_v2` best models | Checkpoints to blend into the ensemble |
| `--regression-weight` | `0.7` | Weight on each model's regression head (classification head gets `1 - this`) |

## 3. Backend (FastAPI)

From `age_prediction_pipeline`, with the venv active:

```bash
pip install -r backend\requirements.txt
```

Optional — override allowed CORS origins:

```bash
set FRONTEND_ORIGINS=http://localhost:5173,http://your-frontend-host
```

Run the server:

```bash
uvicorn backend.main:app --reload --port 5000
```

Health check:

```bash
curl http://localhost:5000/health
```

See [backend/API.md](backend/API.md) and [backend/RUN.md](backend/RUN.md) for endpoint details.

## 4. Frontend (Vite + React)

From `frontend`:

```bash
npm install
npm run dev        # start dev server (http://localhost:5173)
npm run build       # production build
npm run preview     # preview the production build
npm run lint         # run ESLint
```

Point the frontend at a non-default backend URL via `VITE_API_URL` (defaults to `http://localhost:5000`).
