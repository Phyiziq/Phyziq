import { PlanData, NcdProfile, MealLog, NcdConflictWarning, computeConfidenceTier } from '@phyziq/shared';

export interface NcdSubstitutionRule {
  food_item_id: string;
  ncd_risk_type: 'diabetes' | 'hypertension' | 'cardiovascular';
  substitute_food_item_id: string;
}

export interface FoodItemNutrition {
  id: string;
  name: string;
  glycaemic_index: number | null;
  sodium_mg: number | null;
}

/**
 * Applies NCD substitutions to a plan based on the member's NCD profile.
 * Substitutes high-risk food items with safer alternatives deterministically.
 */
export function applyNcdSubstitutions(
  plan: PlanData,
  ncdProfile: NcdProfile | null,
  rules: NcdSubstitutionRule[]
): PlanData {
  if (!ncdProfile) return plan;

  const activeRisks = getActiveRisks(ncdProfile);
  if (activeRisks.length === 0) return plan;

  // Deep clone to avoid mutating the original plan
  const newPlan: PlanData = JSON.parse(JSON.stringify(plan));

  for (const day of newPlan.nutrition_days) {
    for (const meal of day.meals) {
      for (const item of meal.food_items) {
        // Find if this item has a substitution rule for any of the active risks
        const applicableRule = rules.find(
          (r) => r.food_item_id === item.food_item_id && activeRisks.includes(r.ncd_risk_type)
        );

        if (applicableRule) {
          item.food_item_id = applicableRule.substitute_food_item_id;
          // Note: In a full system we'd look up the new name and macros.
          // Since the AI engine is stateless, we just swap the ID and append a marker to the name.
          item.name = item.name + ' (NCD Substituted)';
        }
      }
    }
  }

  return newPlan;
}

/**
 * Reverses NCD substitutions, replacing substitute IDs with original IDs.
 * Used to test round-trip properties.
 */
export function reverseNcdSubstitutions(
  plan: PlanData,
  ncdProfile: NcdProfile | null,
  rules: NcdSubstitutionRule[]
): PlanData {
  if (!ncdProfile) return plan;
  const activeRisks = getActiveRisks(ncdProfile);
  if (activeRisks.length === 0) return plan;

  const newPlan: PlanData = JSON.parse(JSON.stringify(plan));

  for (const day of newPlan.nutrition_days) {
    for (const meal of day.meals) {
      for (const item of meal.food_items) {
        const reversedRule = rules.find(
          (r) => r.substitute_food_item_id === item.food_item_id && activeRisks.includes(r.ncd_risk_type)
        );

        if (reversedRule) {
          item.food_item_id = reversedRule.food_item_id;
          item.name = item.name.replace(' (NCD Substituted)', '');
        }
      }
    }
  }

  return newPlan;
}

/**
 * Detects dietary conflicts in a logged meal against a member's NCD profile.
 */
export function detectNcdConflicts(
  mealLog: MealLog,
  ncdProfile: NcdProfile | null,
  foodDatabase: FoodItemNutrition[]
): NcdConflictWarning[] {
  const warnings: NcdConflictWarning[] = [];
  if (!ncdProfile) return warnings;

  const activeRisks = getActiveRisks(ncdProfile);

  for (const item of mealLog.food_items) {
    const foodData = foodDatabase.find((f) => f.id === item.food_item_id);
    if (!foodData) continue;

    // Diabetes risk: GI bounds
    if (activeRisks.includes('diabetes') && foodData.glycaemic_index && foodData.glycaemic_index > 55) {
      warnings.push({
        food_item_id: item.food_item_id,
        food_name: item.name,
        conflict_reason: `High Glycaemic Index (${foodData.glycaemic_index}) is not recommended for diabetes management.`,
        recommended_alternative_id: null,
        recommended_alternative_name: null,
        confidence: { value: 100, source: 'ai', tier: computeConfidenceTier(100) },
      });
    }

    // Hypertension risk: Sodium bounds
    if (activeRisks.includes('hypertension') && foodData.sodium_mg && foodData.sodium_mg > 400) {
      warnings.push({
        food_item_id: item.food_item_id,
        food_name: item.name,
        conflict_reason: `High Sodium (${foodData.sodium_mg}mg) is not recommended for hypertension.`,
        recommended_alternative_id: null,
        recommended_alternative_name: null,
        confidence: { value: 100, source: 'ai', tier: computeConfidenceTier(100) },
      });
    }
  }

  return warnings;
}

// Helper to extract active risks
function getActiveRisks(ncdProfile: NcdProfile): Array<'diabetes' | 'hypertension' | 'cardiovascular'> {
  const risks: Array<'diabetes' | 'hypertension' | 'cardiovascular'> = [];
  if (ncdProfile.diabetes_risk && ncdProfile.diabetes_risk !== 'low') risks.push('diabetes');
  if (ncdProfile.hypertension_risk && ncdProfile.hypertension_risk !== 'low') risks.push('hypertension');
  if (ncdProfile.cardiovascular_risk && ncdProfile.cardiovascular_risk !== 'low') risks.push('cardiovascular');
  return risks;
}
