# How This Project Works — Beginner Guide

This explains the age-prediction pipeline conceptually, step by step, assuming
no prior AI/ML background. For exact commands and CLI flags, see `README.md`
instead — this file is about *why* each step exists and *how* it works.

## The big picture

You're teaching a computer to look at a face photo and guess the person's
age — the same way a human glances at someone and guesses "probably
mid-30s." To do that, you show it tens of thousands of photos where you
*already know* the true age (because the photo's folder name says so), and
it gradually learns the visual patterns that correlate with age (skin
texture, wrinkles, hair, etc.). That's "training a model." Once trained, you
can hand it a brand-new photo it's never seen and it'll guess.

## Step 1 — Raw data

You have two folders of face photos (`archive/20-50/` and
`archive/age_prediction_up/`), each organized as `train/<age>/photo.jpg` —
the folder name *is* the label. No code needed to "know" the age; it's baked
into the file path.

## Step 2 — Build a manifest (`src/build_manifest.py`)

A neural network doesn't read folders — it needs one big list: "this file,
this age." `src/build_manifest.py` walks both folders and writes
`data/manifest.csv`, one row per photo. It also flags duplicate photos that
appear in both datasets, so you don't accidentally train on the same photo
twice.

## Step 3 — Align the faces (`src/align_faces.py`)

Photos have faces at different angles, positions, and zoom levels — that
variation makes learning harder ("is this pattern because of age, or
because the face is rotated?"). This step finds 5 landmark points on each
face (eyes, nose, mouth corners) using a face-detection library, then
mathematically warps the photo so every face ends up in the same pose —
eyes always at the same pixel position, etc. This is called **alignment**,
and it's a standard preprocessing trick: it removes pose/position variation
so the model can focus purely on age-related features.

## Step 4 — The model itself (`src/model.py`)

This is the actual "brain." It's a **convolutional neural network (CNN)** —
a type of model built for images, which learns to detect visual patterns
(edges → textures → shapes → higher-level concepts like "wrinkle" or
"wrinkleless") in layers. This project uses a pretrained CNN (ResNet,
already trained by someone else on millions of general photos to recognize
shapes) as a starting point, called the **backbone**, rather than starting
from random — this is called **transfer learning** and it makes training
much faster and more accurate with less data.

On top of the shared backbone sit **two heads** (two small extra layers)
that each answer the age question differently:

- **Classification head** — picks one specific age out of 100 possible
  buckets ("I'm 87% sure this is 34, or maybe 33").
- **Regression head** — outputs one continuous number directly ("34.2").

Both heads see the same underlying features from the backbone; they just
interpret them differently.

## Step 5 — Training (`src/train.py`)

This is where the actual "learning" happens. In plain terms:

1. Feed the model a batch of photos.
2. It makes a guess for each (from both heads).
3. Compare the guess to the true age — the gap between guess and truth is
   the **loss** (a single number: "how wrong was I").
4. Nudge the model's internal numbers slightly in the direction that would
   have reduced that error. (This step, called **backpropagation**, is the
   actual "learning" — repeated millions of times it's what makes the model
   good.)
5. Repeat for the whole dataset — one full pass through all training photos
   is called an **epoch**. This repeats for many epochs (up to 30 here).

A few important details baked into this project:

- **Train/val/test split** — the dataset is split three ways. The model
  only ever learns from the "train" portion. A held-out "val" (validation)
  slice checks progress after each epoch without letting the model actually
  learn from it — this catches **overfitting** (when a model starts
  memorizing training photos instead of learning general age patterns,
  which would make it useless on new photos). If val performance stops
  improving for several epochs in a row (**patience**), training stops
  early.
- **Combined loss** — since there are two heads, the loss is a blend of
  "how wrong was the classification guess" + "how wrong was the regression
  guess," so both heads improve together from one shared backbone.
- **Weighted sampler** — the dataset has way more 25-40 year-olds than 90+
  year-olds. Without correction, the model would mostly just learn to
  predict the popular ages and barely learn the rare ones. This forces the
  training loop to show rare-age photos proportionally more often each
  epoch.
- **Soft labels** — normally, classification treats "guessed 26, true was
  25" exactly as wrong as "guessed 90, true was 25." Since age is a
  continuum, this is silly — the model is now told that near-miss answers
  are "less wrong," which makes it learn more sensible behavior.

The result of training is `best_model.pt` — a saved file of all the
model's learned internal numbers (weights), taken from whichever epoch had
the best validation score.

## Step 6 — Evaluation (`src/evaluate.py`)

Training doesn't tell you how good the model *really* is (it was tuned
against val, not fully unseen data). This step runs the finished model
against the **test set** — photos held back from the entire process — and
reports honest metrics:

- **Exact accuracy** — % of guesses that hit the exact right year
  (inherently low; guessing someone's *exact* age is hard even for
  humans).
- **Within-3/5-years accuracy** — % of guesses close enough to be
  practically useful — a much more meaningful number.
- **MAE (mean absolute error)** — on average, how many years off is the
  model?
- **Confusion matrix** — a big grid showing, for every true age, what the
  model tended to guess. A good model shows a bright diagonal (correct
  guesses) with errors clustered nearby, not scattered randomly.
- **Blended prediction + range** — combines both heads into one number,
  plus a "likely between X and Y" range based on how confident/spread-out
  the model's guesses were.

## Step 7 — Predict on one new photo (`src/predict.py`)

Once you trust the model, this is the "use it" step — load the saved
`best_model.pt`, feed it one photo, get back a predicted age and range.
This is called **inference** (as opposed to training).

## The whole flow, in order

```
raw photos  ->  manifest.csv  ->  aligned photos  ->  train.py  ->  best_model.pt
 (labeled)      (one big list)   (faces normalized)  (learning)   (the trained brain)
                                                                        |
                                              +-----------------------+-----------------------+
                                              v                                                 v
                                    evaluate.py (honest report card,                  predict.py (use it on
                                    run once on test photos)                           one new photo)
```

Each script is a separate, resumable stage so you're never forced to redo
the slow steps (alignment, training) just to try a new evaluation or
prediction.
