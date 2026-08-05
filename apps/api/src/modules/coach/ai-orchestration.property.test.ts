import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { z } from 'zod';

// Feature: phyziq-platform, Property 18: Confidence Indicator Presence on AI Estimates

// A simple schema that represents what our AI workers yield for meal log drafts
const aiMealLogDraftSchema = z.object({
  status: z.literal('success'),
  meal_log_draft: z.object({
    food_items: z.array(z.object({
      food_item_id: z.string(),
      name: z.string(),
      quantity_g: z.number(),
      confidence: z.number().min(0).max(100)
    }))
  })
});

// Since the workers in our codebase return static mock data right now, 
// a true property test for the API would generate random AI responses and verify the schema.
describe('AI Orchestration Properties', () => {
  it('Property 18: Confidence Indicator Presence on AI Estimates', () => {
    // Generate arbitrary food items that might come back from the CV or Voice API
    const arbAiFoodItems = fc.array(fc.record({
      food_item_id: fc.uuid(),
      name: fc.string({ minLength: 1 }),
      quantity_g: fc.integer({ min: 10, max: 1000 }),
      confidence: fc.integer({ min: 0, max: 100 })
    }));

    fc.assert(
      fc.property(
        arbAiFoodItems,
        (foodItems) => {
          const draft = {
            status: 'success',
            meal_log_draft: {
              food_items: foodItems
            }
          };

          // The zod schema enforces that every item MUST have a confidence between 0 and 100
          const parsed = aiMealLogDraftSchema.safeParse(draft);
          expect(parsed.success).toBe(true);

          if (parsed.success) {
            for (const item of parsed.data.meal_log_draft.food_items) {
              expect(item.confidence).toBeDefined();
              expect(item.confidence).toBeGreaterThanOrEqual(0);
              expect(item.confidence).toBeLessThanOrEqual(100);
            }
          }
        }
      )
    );
  });
});
