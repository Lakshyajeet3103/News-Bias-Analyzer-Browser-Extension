# Reproducible evaluation

`npm run eval -- evaluation/dataset.jsonl` evaluates a fixed, deterministic sample of at most 450 articles (150 per class). Input rows must contain `id`, `title`, `text`, and `label` (`left`, `centre`, `right`). Optional cached fields are `publisherPrior`, `gemini`, `combined`, `removedEvidence`, and `totalEvidence`.

The recommended corpus is the Apache-2.0 Hugging Face mirror `siddharthmb/article-bias-prediction-media-splits`, derived from Baly et al. (2020). Do not commit the 223 MB corpus or copyrighted article bodies here. The mirror advertises Apache-2.0, but users should independently confirm that its redistribution terms meet their use case. A corpus is deliberately not auto-downloaded.

Gemini predictions should be generated with the same extension model and cached before running metrics. This repository never reads an API key from source control. If a variant is absent, its result is `null` instead of being estimated or fabricated.
