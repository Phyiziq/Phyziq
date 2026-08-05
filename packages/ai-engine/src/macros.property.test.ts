import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { adaptMacroTargets, generateGroceryList, optimizeBudget } from './macros.js';
import { BiometricLog } from '@phyziq/shared';

// Feature: phyziq-platform, Property 7: Macro Adaptation Direction
// Feature: phyziq-platform, Property 8: Grocery List Coverage
// Feature: phyziq-platform, Property 9: Budget Optimiser Ordering

const arbWeightLog = fc.record({
  id: fc.uuid(),
  member_id: fc.uuid(),
  logged_at: fc.date({ min: new Date('2023-01-01'), max: new Date('2025-01-01') }).map(d => d.toISOString()),
  weight_kg: fc.float({ min: 40, max: 150 }),
  body_fat_pct: fc.constant(null),
  resting_hr: fc.constant(null),
  blood_pressure_systolic: fc.constant(null),
  blood_pressure_diastolic: fc.constant(null),
  notes: fc.constant(null),
}) as fc.Arbitrary<BiometricLog>;

describe('Macro Adaptation Properties', () => {
  it('Property 7: Macro Adaptation Direction', () => {
    // Manually construct gaining and losing trends to test logic directly
    const baseLog: BiometricLog = {
      id: '1', member_id: 'm1', logged_at: new Date('2024-01-01').toISOString(), weight_kg: 80,
      body_fat_pct: null, resting_hr: null, blood_pressure_systolic: null, blood_pressure_diastolic: null, notes: null
    };

    const gainingLogs = [
      { ...baseLog, logged_at: new Date('2024-01-01').toISOString(), weight_kg: 80 },
      { ...baseLog, logged_at: new Date('2024-01-07').toISOString(), weight_kg: 81 },
    ];

    const losingLogs = [
      { ...baseLog, logged_at: new Date('2024-01-01').toISOString(), weight_kg: 80 },
      { ...baseLog, logged_at: new Date('2024-01-07').toISOString(), weight_kg: 79 },
    ];

    const baselineTDEE = 2000;

    // Fat loss goal + Gaining weight -> Reduce calories
    const reduced = adaptMacroTargets(gainingLogs, 'fat_loss', baselineTDEE);
    expect(reduced.calories).toBeLessThan(baselineTDEE);

    // Muscle gain goal + Losing weight -> Increase calories
    const increased = adaptMacroTargets(losingLogs, 'muscle_gain', baselineTDEE);
    expect(increased.calories).toBeGreaterThan(baselineTDEE);
  });
});

describe('Grocery List Properties', () => {
  it('Property 8: Grocery List Coverage', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          food_item_id: fc.uuid(),
          name: fc.string(),
          quantity_g: fc.integer({ min: 10, max: 500 }),
          calories: fc.constant(100),
          protein_g: fc.constant(10),
          carbs_g: fc.constant(10),
          fat_g: fc.constant(10)
        }), { maxLength: 20 }),
        (foodItems) => {
          const planData = {
            workout_sessions: [],
            narrative: '',
            nutrition_days: [{
              day: 1,
              total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0,
              meals: [{ meal_type: 'lunch' as const, food_items: foodItems }]
            }]
          };

          const groceryList = generateGroceryList('p1', 1, planData, {});
          
          // Total items in grocery list should equal unique food item IDs
          const uniqueIds = new Set(foodItems.map(f => f.food_item_id));
          expect(groceryList.items.length).toEqual(uniqueIds.size);

          // Total quantity should match sum of quantities for each unique ID
          for (const item of groceryList.items) {
            const sumOriginal = foodItems
              .filter(f => f.food_item_id === item.food_item_id)
              .reduce((sum, f) => sum + f.quantity_g, 0);
            expect(item.estimated_quantity_g).toEqual(sumOriginal);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Budget Optimiser Ordering', () => {
    // A grocery list with a protein item
    const groceryList = {
      plan_id: '1', week_number: 1, generated_at: '',
      items: [
        { food_item_id: 'prot1', name: 'Premium Beef', category: 'protein', estimated_quantity_g: 1000, estimated_cost_kes: null, low_cost_substitutes: [] }
      ]
    };

    const costDb = [
      { food_item_id: 'prot1', name: 'Premium Beef', cost_per_100g_kes: 200 },
      { food_item_id: 'sub1', name: 'Chicken', cost_per_100g_kes: 100 },
      { food_item_id: 'sub2', name: 'Beans', cost_per_100g_kes: 50 },
      { food_item_id: 'sub3', name: 'Lentils', cost_per_100g_kes: 40 },
      { food_item_id: 'sub4', name: 'Eggs', cost_per_100g_kes: 80 }
    ];

    const subMap = { 'prot1': ['sub1', 'sub2', 'sub3', 'sub4'] };

    const optimized = optimizeBudget(groceryList, costDb, subMap);
    const protItem = optimized.items.find(i => i.food_item_id === 'prot1')!;
    
    // Main item cost
    expect(protItem.estimated_cost_kes).toEqual(2000); // 1000g / 100 * 200

    // Top 3 cheapest
    expect(protItem.low_cost_substitutes.length).toEqual(3);
    expect(protItem.low_cost_substitutes[0].name).toEqual('Lentils'); // 40
    expect(protItem.low_cost_substitutes[1].name).toEqual('Beans'); // 50
    expect(protItem.low_cost_substitutes[2].name).toEqual('Eggs'); // 80

    // Cost ordering invariant
    expect(protItem.low_cost_substitutes[0].estimated_cost_kes).toBeLessThanOrEqual(protItem.low_cost_substitutes[1].estimated_cost_kes);
    expect(protItem.low_cost_substitutes[1].estimated_cost_kes).toBeLessThanOrEqual(protItem.low_cost_substitutes[2].estimated_cost_kes);
  });
});
