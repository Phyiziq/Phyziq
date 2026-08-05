import { BiometricLog, PlanData, GroceryList, GroceryListItem } from '@phyziq/shared';

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'maintenance';

/**
 * Adjusts macro targets using an exponential moving average (EMA) of a 7-day weight trend.
 * If weight is moving in the wrong direction relative to the goal, calories are adjusted.
 */
export function adaptMacroTargets(
  weightLogs: BiometricLog[],
  goal: FitnessGoal,
  baselineTDEE: number
): MacroTargets {
  // Sort logs by date ascending
  const sortedLogs = [...weightLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  let ema = 0;
  let hasValidData = false;
  let firstWeight = 0;
  let lastWeight = 0;
  const ALPHA = 0.3; // Smoothing factor for EMA

  for (const log of sortedLogs) {
    if (log.weight_kg != null) {
      if (!hasValidData) {
        ema = log.weight_kg;
        firstWeight = log.weight_kg;
        hasValidData = true;
      } else {
        ema = ALPHA * log.weight_kg + (1 - ALPHA) * ema;
      }
      lastWeight = log.weight_kg;
    }
  }

  let targetCalories = baselineTDEE;

  if (hasValidData) {
    const trend = lastWeight - firstWeight;
    const isGaining = trend > 0.5; // gained more than 0.5kg
    const isLosing = trend < -0.5; // lost more than 0.5kg

    if (goal === 'fat_loss' && isGaining) {
      targetCalories *= 0.9; // Reduce calories by 10%
    } else if (goal === 'muscle_gain' && isLosing) {
      targetCalories *= 1.1; // Increase calories by 10%
    }
  }

  // Standard macro split: Protein 30%, Fat 30%, Carbs 40%
  // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
  const protein_g = Math.round((targetCalories * 0.3) / 4);
  const carbs_g = Math.round((targetCalories * 0.4) / 4);
  const fat_g = Math.round((targetCalories * 0.3) / 9);

  return {
    calories: Math.round(targetCalories),
    protein_g,
    carbs_g,
    fat_g,
  };
}

export interface FoodCategoryMap {
  [foodItemId: string]: string; // Maps item ID to category (e.g. 'protein', 'carb')
}

/**
 * Aggregates all ingredient references across all meals to generate a weekly grocery list.
 */
export function generateGroceryList(
  planId: string,
  weekNumber: number,
  weeklyNutritionPlan: PlanData,
  categoryMap: FoodCategoryMap
): GroceryList {
  const itemMap = new Map<string, GroceryListItem>();

  for (const day of weeklyNutritionPlan.nutrition_days) {
    for (const meal of day.meals) {
      for (const item of meal.food_items) {
        const existing = itemMap.get(item.food_item_id);
        if (existing) {
          existing.estimated_quantity_g += item.quantity_g;
        } else {
          itemMap.set(item.food_item_id, {
            food_item_id: item.food_item_id,
            name: item.name,
            category: categoryMap[item.food_item_id] || 'other',
            estimated_quantity_g: item.quantity_g,
            estimated_cost_kes: null,
            low_cost_substitutes: [],
          });
        }
      }
    }
  }

  return {
    plan_id: planId,
    week_number: weekNumber,
    generated_at: new Date().toISOString(),
    items: Array.from(itemMap.values()),
  };
}

export interface CostData {
  food_item_id: string;
  name: string;
  cost_per_100g_kes: number;
}

/**
 * Optimises the budget by flagging low-cost substitutes for protein sources.
 */
export function optimizeBudget(
  groceryList: GroceryList,
  costDatabase: CostData[],
  substituteMap: Record<string, string[]> // item ID -> array of substitute item IDs
): GroceryList {
  const optimizedList = JSON.parse(JSON.stringify(groceryList)) as GroceryList;

  for (const item of optimizedList.items) {
    const costInfo = costDatabase.find((c) => c.food_item_id === item.food_item_id);
    if (costInfo) {
      item.estimated_cost_kes = (item.estimated_quantity_g / 100) * costInfo.cost_per_100g_kes;
    }

    if (item.category === 'protein') {
      const subs = substituteMap[item.food_item_id] || [];
      const validSubs = subs
        .map((subId) => costDatabase.find((c) => c.food_item_id === subId))
        .filter((c): c is CostData => c !== undefined);

      // Sort by cost ascending
      validSubs.sort((a, b) => a.cost_per_100g_kes - b.cost_per_100g_kes);

      // Take top 3 cheapest
      item.low_cost_substitutes = validSubs.slice(0, 3).map((sub) => ({
        food_item_id: sub.food_item_id,
        name: sub.name,
        estimated_cost_kes: (item.estimated_quantity_g / 100) * sub.cost_per_100g_kes,
      }));
    }
  }

  return optimizedList;
}
