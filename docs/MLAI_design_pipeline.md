# ML/AI Design Document

## 1. Objective

The ML system will classify detected thermal events into meaningful categories and provide a confidence score.

The model should not rely solely on satellite thermal intensity.

Instead, it will combine:

* thermal features
* industrial-context features
* land-cover features
* spatial features
* temporal features
* persistence features
* optional satellite-image features

---

# 2. ML Pipeline

```text
Raw FIRMS Data
      ↓
Data Cleaning
      ↓
Event Clustering
      ↓
Spatial Association
      ↓
Persistence Analysis
      ↓
Feature Engineering
      ↓
Training Dataset
      ↓
Train/Validation/Test
      ↓
Model Training
      ↓
Evaluation
      ↓
Model Selection
      ↓
FastAPI Model Service
```

---

# 3. Classification Classes

Initial candidate classes:

```text
Class 1 → Industrial Fire

Class 2 → Persistent Industrial Thermal Source

Class 3 → Gas Flare

Class 4 → Wildfire / Forest Fire

Class 5 → Agricultural Fire

Class 6 → Mining / Industrial Activity

Class 7 → Other / Unknown
```

The final class set should be determined from the actual available labelled data.

---

# 4. Feature Groups

## 4.1 Thermal Features

```text
brightness
FRP
confidence
day/night
satellite
```

---

# 5. Industrial Features

```text
distance_to_nearest_industry
facility_type
facility_count
industrial_density
distance_to_power_plant
distance_to_refinery
distance_to_mine
```

These are extremely useful for distinguishing industrial events from natural fires.

---

# 6. Land-Cover Features

```text
land_cover_class
forest_percentage
cropland_percentage
urban_percentage
industrial_percentage
water_percentage
```

These help determine environmental context.

---

# 7. Temporal Features

```text
detection_count
active_days
duration
hour_of_day
day_of_week
season
```

Historical patterns can be particularly useful for persistent sources.

---

# 8. Persistence Features

```text
persistence_score
consecutive_days
recurrence_rate
spatial_stability
mean_FRP
FRP_variation
```

A repeatedly detected point near an industrial facility is likely very different from a one-time hotspot in a forest.

---

# 9. Spatial Features

```text
cluster_size
hotspot_density
number_of_nearby_hotspots
distance_to_forest
distance_to_cropland
distance_to_water
```

---

# 10. Optional Satellite Features

For the second phase, satellite imagery can be incorporated.

Possible approaches:

### Approach A — Pretrained CNN

Extract image embeddings from a pretrained vision model.

### Approach B — CNN Fine-Tuning

Train a CNN using labelled satellite patches.

### Approach C — Vision Transformer

Use a pretrained ViT/remote-sensing model.

However, these approaches should only be introduced after establishing a strong tabular baseline.

---

# 11. Recommended Model Strategy

## Phase 1

Start with:

**Random Forest**

and

**XGBoost**

These models are appropriate because most initial features are structured/tabular.

---

# 12. Why XGBoost?

XGBoost can handle:

* nonlinear relationships
* mixed feature importance
* numerical features
* complex interactions
* relatively small/medium datasets

Example relationship:

```text
High FRP
+
Very close to refinery
+
Repeated every night
+
Industrial land cover
        ↓
High probability of industrial thermal source
```

This type of nonlinear interaction is suitable for tree-based models.

---

# 13. Baseline Model

Use:

**Logistic Regression**

as a baseline.

Then compare:

```text
Logistic Regression
       ↓
Random Forest
       ↓
XGBoost
```

The best model should be selected based on validation performance, not simply complexity.

---

# 14. Class Imbalance

Some classes may have significantly more observations than others.

Possible techniques:

* class weights
* oversampling
* SMOTE where appropriate
* undersampling
* threshold tuning

Do not apply SMOTE blindly to spatial/temporal data because it can create unrealistic synthetic samples if the feature relationships are not suitable.

---

# 15. Data Splitting

Avoid simple random splitting if multiple observations come from the same event/location.

Preferred:

```text
Training
↓
Known geographic/time periods

Validation
↓
Different samples

Testing
↓
Unseen locations/time periods
```

This better measures real-world generalization.

---

# 16. Evaluation Metrics

Use:

### Accuracy

Useful as a general metric but insufficient with class imbalance.

### Precision

Measures how many predicted events of a class were actually that class.

### Recall

Measures how many actual events of a class were detected.

### F1 Score

Balances precision and recall.

### Confusion Matrix

Essential for understanding which classes are being confused.

---

# 17. Primary ML Metric

Use **macro F1-score** as an important metric because the system contains multiple classes and some classes may be underrepresented.

Also report:

```text
Accuracy
Macro Precision
Macro Recall
Macro F1
Per-class F1
Confusion Matrix
```

---

# 18. Explainability

The system should explain why a prediction was made.

For tree-based models, use:

* feature importance
* SHAP where practical

Example:

```text
Prediction:
Persistent Industrial Thermal Source
Confidence: 94%

Important factors:
+ High recurrence
+ Low spatial movement
+ 0.3 km from refinery
+ Industrial land cover
+ Consistent FRP
```

This is valuable for a government/monitoring-oriented application.

---

# 19. Confidence Score

The model should return a probability/confidence estimate.

Example:

```text
Industrial Fire          0.82
Persistent Source        0.11
Wildfire                 0.03
Agricultural Fire        0.02
Other                    0.02
```

Predicted class:

```text
Industrial Fire
Confidence = 82%
```

The team should distinguish model probability from a formally calibrated confidence score and calibrate probabilities if needed.

---

# 20. Risk/Severity Score

Classification and severity should be treated as separate concepts.

For example:

```text
Classification:
Industrial Fire

Severity:
High
```

Potential severity features:

* FRP
* persistence
* proximity to critical infrastructure
* event size
* duration

The exact severity methodology should be defined separately from the classifier.

---

# 21. Model Architecture

```text
              Thermal Features
                    │
              Industrial Features
                    │
              Land Cover Features
                    │
              Temporal Features
                    │
              Spatial Features
                    │
              Persistence Features
                    │
                    ↓
             Feature Processor
                    ↓
              XGBoost Model
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
    Predicted Class       Probabilities
          │                   │
          └─────────┬─────────┘
                    ↓
             Explanation
                    ↓
              FastAPI API
```

---

# 22. Training Pipeline

```text
Raw Data
   ↓
Clean
   ↓
Generate Events
   ↓
Generate Labels
   ↓
Feature Engineering
   ↓
Train/Validation/Test Split
   ↓
Baseline
   ↓
Random Forest
   ↓
XGBoost
   ↓
Hyperparameter Tuning
   ↓
Evaluation
   ↓
Model Selection
   ↓
Save Model
```

---

# 23. Hyperparameter Optimization

For XGBoost, tune parameters such as:

```text
n_estimators
max_depth
learning_rate
subsample
colsample_bytree
min_child_weight
```

Use cross-validation appropriate to the spatial/temporal structure of the data.

---

# 24. Model Artifact

Save:

```text
model.pkl
```

or an appropriate serialized model format.

Also save:

```text
feature_schema.json
preprocessor.pkl
model_metadata.json
```

Model metadata should include:

```text
model_version
dataset_version
training_date
features
classes
metrics
```

---

# 25. Inference Architecture

```text
React
   ↓
Express API
   ↓
FastAPI
   ↓
Feature Validation
   ↓
Preprocessor
   ↓
XGBoost
   ↓
Prediction
   ↓
Express
   ↓
React
```

---

# 26. Prediction API

Example:

```text
POST /predict
```

Input:

```text
{
  "frp": 152.4,
  "brightness": 341.2,
  "confidence": 87,
  "facility_distance": 0.42,
  "facility_type": "refinery",
  "detection_count": 24,
  "active_days": 18,
  "duration": 25,
  "persistence_score": 0.86,
  "land_cover": "industrial",
  "cluster_size": 4
}
```

Output:

```text
{
  "class": "Persistent Industrial Thermal Source",
  "confidence": 0.94,
  "model_version": "v1.0"
}
```

---

# 27. Model Monitoring

Track:

* prediction distribution
* confidence distribution
* class distribution
* input-data drift
* model performance when new labels become available

Future versions can implement automated retraining.

---

# 28. ML Development Phases

## Phase 1 — Baseline

FIRMS + OSM + temporal features.

## Phase 2 — Strong Tabular Model

Add land cover + spatial features.

## Phase 3 — Advanced Model

Add satellite-image features.

## Phase 4 — Multimodal Model

Combine:

```text
Tabular Model
+
Satellite Vision Model
```

---

# 29. Recommended Final AI Architecture

For the SIH prototype:

```text
                 FIRMS
                   │
                 OSM
                   │
              Land Cover
                   │
             Satellite Data
                   │
                   ↓
          Feature Engineering
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
 Tabular Features       Image Features
        ↓                     ↓
    XGBoost              CNN/ViT
        │                     │
        └──────────┬──────────┘
                   ↓
            Fusion / Ensemble
                   ↓
             Final Class
                   ↓
          Confidence + Explainability
```

But **the CNN/ViT branch should be Phase 2/3**. The first demonstrable version should work using the tabular/geospatial pipeline.

---

# 30. Key AI Principle

The system should answer:

> **"What is this thermal anomaly most likely to represent, given its thermal characteristics, geographic context, industrial infrastructure, land cover and historical behaviour?"**

rather than merely asking:

> **"Is there a fire in this satellite image?"**

That distinction is what makes the proposed solution aligned with PS 26162.
