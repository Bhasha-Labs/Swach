# Swachta Index (SI)

This document provides the mathematical foundation for the Swachta Index (SI) - a quantifiable measure of environmental cleanliness.

---

## Swacchta Index (SI) - Mathematical Foundation

The **Swacchta Index** is a comprehensive cleanliness metric that converts garbage detection data into a standardized score from 0-100, where 100 represents perfect cleanliness.

### Core Algorithm

```
Swacchta Index (SI) = max(0, 100 - Total_Impact_Score)
```

Where `Total_Impact_Score` is calculated as:

```
Total_Impact_Score = Base_Impact + Coverage_Penalty + Density_Penalty + 
                    Large_Object_Penalty + Pollution_Penalty + Variety_Penalty
```

---

### Detailed Mathematical Breakdown

#### **1. Base Impact Calculation**
For each detected object `i`:
```
Base_Impact_i = Confidence_i × Severity_Weight_i × Size_Multiplier_i
```

**Size Multiplier:**
```
Size_Multiplier_i = 1 + (Area_Ratio_i × 10)
where Area_Ratio_i = Object_Area_i / Image_Area
```

**Severity Weights:**
- `garbage`: 1.5, `trash`: 1.8, `plastic`: 2.0
- `hazardous`: 3.0, `medical`: 2.8, `electronic`: 2.2

#### **2. Coverage Penalty (Exponential)**
Based on total area covered by all garbage objects:
```
Coverage_Ratio = Total_Garbage_Area / Image_Area

if Coverage_Ratio > 0.5:
    Coverage_Penalty = 80 + (Coverage_Ratio - 0.5) × 200     # Up to 180 points
elif Coverage_Ratio > 0.25:
    Coverage_Penalty = 40 + (Coverage_Ratio - 0.25) × 160    # 40-80 points  
elif Coverage_Ratio > 0.1:
    Coverage_Penalty = 15 + (Coverage_Ratio - 0.1) × 166     # 15-40 points
else:
    Coverage_Penalty = Coverage_Ratio × 150                   # 0-15 points
```

#### **3. Density Penalty (Exponential Object Count)**
```
Object_Count = Number of detected objects

if Object_Count ≤ 5:
    Density_Penalty = Object_Count × 8
elif Object_Count ≤ 15:
    Density_Penalty = 40 + (Object_Count - 5) × 12
else:
    Density_Penalty = 160 + (Object_Count - 15) × 18
```

#### **4. Large Object Penalty**
For objects covering significant visual area:
```
if Area_Ratio_i > 0.1:        # Large objects (>10% of image)
    Large_Object_Penalty_i = Area_Ratio_i × 150 × Severity_Weight_i
elif Area_Ratio_i > 0.05:     # Medium objects (5-10% of image)  
    Large_Object_Penalty_i = Area_Ratio_i × 100 × Severity_Weight_i
else:                         # Small objects (<5% of image)
    Large_Object_Penalty_i = Area_Ratio_i × 75
```

#### **5. Additional Penalties**
```
Pollution_Penalty = max(0, (Visual_Density - 50) × 2)
where Visual_Density = Object_Count / max(Coverage_Ratio, 0.01)

Variety_Penalty = max(0, (Unique_Object_Types - 2) × 8)
```

---

### **Example Calculation**

**Scenario:** Tokyo street with 3 detected objects
- Object 1: `trash`, confidence=0.8, area=2% of image
- Object 2: `plastic`, confidence=0.6, area=1% of image  
- Object 3: `garbage`, confidence=0.4, area=0.5% of image

#### **Step 1: Base Impact**
```
Object 1: Base_Impact_1 = 0.8 × 1.8 × (1 + 0.02×10) = 0.8 × 1.8 × 1.2 = 1.728
Object 2: Base_Impact_2 = 0.6 × 2.0 × (1 + 0.01×10) = 0.6 × 2.0 × 1.1 = 1.32
Object 3: Base_Impact_3 = 0.4 × 1.5 × (1 + 0.005×10) = 0.4 × 1.5 × 1.05 = 0.63

Total_Base_Impact = 1.728 + 1.32 + 0.63 = 3.678
```

#### **Step 2: Coverage Penalty**
```
Coverage_Ratio = (2% + 1% + 0.5%) / 100% = 0.035
Since 0.035 < 0.1: Coverage_Penalty = 0.035 × 150 = 5.25
```

#### **Step 3: Density Penalty**
```
Object_Count = 3 ≤ 5
Density_Penalty = 3 × 8 = 24
```

#### **Step 4: Large Object Penalty**
```
Object 1: 0.02 < 0.05 → Large_Object_Penalty_1 = 0.02 × 75 = 1.5
Object 2: 0.01 < 0.05 → Large_Object_Penalty_2 = 0.01 × 75 = 0.75  
Object 3: 0.005 < 0.05 → Large_Object_Penalty_3 = 0.005 × 75 = 0.375

Total_Large_Object_Penalty = 1.5 + 0.75 + 0.375 = 2.625
```

#### **Step 5: Additional Penalties**
```
Visual_Density = 3 / 0.035 = 85.7
Pollution_Penalty = (85.7 - 50) × 2 = 71.4

Unique_Types = 3 (trash, plastic, garbage)
Variety_Penalty = (3 - 2) × 8 = 8
```

#### **Final Calculation**
```
Total_Impact_Score = 3.678 + 5.25 + 24 + 2.625 + 71.4 + 8 = 114.953

Swacchta_Index = max(0, 100 - 114.953) = 0
Grade: F (Catastrophic)
```

---

###  **Grading Scale**

| Score Range | Grade | Description | Color |
|-------------|-------|-------------|-------|
| 95-100 | A+ | 🌟 Excellent - Pristine | Green |
| 85-94 | A | ✨ Very Good - Clean | Light Green |
| 75-84 | B+ | 👍 Good - Mostly Clean | Yellow-Green |
| 65-74 | B | ⚠️ Fair - Some Issues | Yellow |
| 55-64 | C+ | 🔶 Moderate - Noticeable Litter | Orange |
| 45-54 | C | ⚠️ Poor - Significant Garbage | Dark Orange |
| 35-44 | D+ | 🚨 Bad - Heavy Pollution | Red-Orange |
| 25-34 | D | 💀 Very Bad - Severe Issues | Red |
| 15-24 | F+ | 🔴 Critical - Environmental Hazard | Dark Red |
| 0-14 | F | ☠️ Catastrophic - Immediate Action Required | Dark Red |

---

###  **Algorithm Features**

1. **Area-Weighted**: Larger garbage has exponentially more impact
2. **Confidence-Sensitive**: Higher confidence detections weighted more heavily  
3. **Type-Aware**: Different garbage types have different severity impacts
4. **Density-Conscious**: Crowded garbage areas penalized more severely
5. **Exponential Scaling**: Penalties increase non-linearly with pollution severity
6. **Context-Aware**: Considers visual pollution density and object variety

This mathematical foundation ensures the Swacchta Index provides meaningful, policy-relevant cleanliness assessments for urban environmental monitoring.

--- 

### Blame : vishesh @bhasha-labs
