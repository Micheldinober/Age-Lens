# Age Lens

Predicts a person's age from a face photo, two ways at once — a
**classification** head (picks the most likely exact age) and a
**regression** head (outputs a continuous age estimate) — sharing one CNN
backbone, ensembled across three trained models. Ships as a full stack:
a local training pipeline, a FastAPI inference backend, and a React
frontend deployable to Firebase Hosting.

## Contents

- [How it works](#how-it-works)
- [Repo layout](#repo-layout)
- [Run the app (backend + frontend)](#run-the-app-backend--frontend)
- [Train your own models](#train-your-own-models)
- [API](#api)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)

## How it works

```
raw photos  ->  manifest.csv  ->  aligned photos  ->  train.py  ->  best_model.pt
 (labeled)      (one big list)   (faces normalized)  (learning)   (the trained brain)
                                                                        |
                                              +-----------------------+-----------------------+
                                              v                                                 v
                                    evaluate.py (honest report card,                  FastAPI backend + React
                                    run once on test photos)                           frontend (live prediction)
```

Full conceptual walkthrough (no ML background assumed): [HOW_IT_WORKS.md](HOW_IT_WORKS.md).

## Repo layout

```
src/      pipeline scripts (build_manifest, align_faces, train, evaluate, predict, ...)
data/     manifest CSVs (generated/updated by the scripts below)
aligned/  aligned face images written by align_faces.py
models/   downloaded model bundles (e.g. face_landmarker.task)
runs/     training output per run (checkpoints, metrics, plots)
backend/  FastAPI server that serves the trained ensemble to the frontend
frontend/ React + Vite web UI, deployed to Firebase Hosting
```

Every terminal command used across this project — setup, pipeline steps,
backend, frontend — is collected in [COMMANDS.md](COMMANDS.md).

## Run the app (backend + frontend)

This is the fastest path to a working demo using the checkpoints already in
`runs/`.

**Backend** (from the project root):

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload --port 5000
```

**Frontend** (from `frontend/`, in a second terminal):

```bash
npm install
npm run dev
```

Open the printed Vite URL (default `http://localhost:5173`). Full details,
env vars, and troubleshooting: [backend/RUN.md](backend/RUN.md) and
[frontend/README.md](frontend/README.md).

## Train your own models

Everything here runs locally (no cloud upload of images needed). A GPU
speeds things up a lot; everything falls back to CPU automatically.

**1. Setup**

```bash
python -m venv venv
venv\Scripts\activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128   # GPU (CUDA 12.8)
pip install -r requirements.txt
```

CPU-only machines can skip the CUDA wheel and just run
`pip install -r requirements.txt`. Face alignment also needs MediaPipe's
FaceLandmarker model bundle, downloaded once:

```bash
curl -L -o models\face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

**2. Build the label manifest**

```bash
python src\build_manifest.py --narrow-root "D:\NPN\20-50\20-50" --full-root "D:\NPN\age_prediction_up\age_prediction" --out data\manifest.csv
```

Walks both dataset folders and writes `data\manifest.csv`
(`filepath, age, split, source_dataset, is_duplicate, keep`). Doesn't touch
the original images.

**3. Align faces**

```bash
python src\align_faces.py --manifest data\manifest.csv --aligned-dir aligned --out data\manifest_aligned.csv
```

Face detection + landmark alignment (MediaPipe) on every image, writing
aligned 128x128 copies under `aligned\`. Resumable — re-running skips images
that already have an aligned output on disk. Images where no face is
detected fall back to a resized (unaligned) copy, flagged
`alignment_ok=False`.

**4. Train**

```bash
python src\train.py --manifest data\manifest_aligned.csv --epochs 30 --out-dir runs\exp1
```

Trains a shared backbone (`resnet18`, `resnet50`, `efficientnet_b0`, or
`mobilenet_v2`) with two heads — classification and regression — on a
combined loss, with early stopping on validation loss. Saves
`best_model.pt`, `training_history.csv`, and `test_split.csv` into
`--out-dir`.

**5. Evaluate**

```bash
python src\evaluate.py --checkpoint runs\exp1\best_model.pt --test-split runs\exp1\test_split.csv
```

Reports classification vs. regression side by side — exact accuracy,
within-3/5-years accuracy, MAE, RMSE — plus a predicted-vs-actual scatter
plot.

**6. Predict on one image**

```bash
python src\predict.py --image "C:\path\to\face.jpg"
```

Blends the classification + regression outputs from an ensemble of trained
checkpoints into one final age estimate.

Every flag for every script (dataset scope, backbone choice, loss
weighting, resuming, comparing backbones, etc.) is documented in
[COMMANDS.md](COMMANDS.md).

## API

The FastAPI backend exposes three endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/upload` | POST | Store an uploaded image, return its URL |
| `/predict` | POST | Face detection + alignment + ensemble inference → age, range, confidence |
| `/health` | GET | Liveness check + how many model checkpoints loaded |

Full request/response shapes and error cases: [backend/API.md](backend/API.md).

## Deployment

The frontend deploys to Firebase Hosting via GitHub Actions
(`frontend/.github/workflows/`):

- Push to `main` → deploys to the live channel.
- Open a pull request → deploys to a preview channel and comments the
  preview URL on the PR.

Both workflows build with `VITE_API_URL` from the repo's Actions variables,
so the deployed frontend points at wherever the FastAPI backend is hosted.

## Tech stack

- **ML pipeline** — PyTorch, torchvision (ResNet18/50, EfficientNet-B0,
  MobileNetV2 backbones), MediaPipe FaceLandmarker, scikit-learn, pandas
- **Backend** — FastAPI, Uvicorn
- **Frontend** — React 19, Vite, React Router
- **Hosting/CI** — Firebase Hosting, GitHub Actions

## Notes / things worth knowing

- **Dataset scope default:** `combined` uses both datasets. Pass
  `--dataset-scope narrow` or `full` to `train.py` to use just one (no need
  to rebuild the manifest).
- **Class imbalance:** ages at the edges of the range typically have fewer
  images — watch the per-age counts `build_manifest.py` prints.
- **Alignment failures:** by default, images that failed alignment are
  still used (resized, not aligned) — pass `--drop-failed-alignment` to
  `train.py` to exclude them instead.
- **Time estimate:** roughly proportional to dataset size × epochs. Use
  `--limit` in step 3 and a small `--epochs` in step 4 for a fast
  end-to-end dry run first.
