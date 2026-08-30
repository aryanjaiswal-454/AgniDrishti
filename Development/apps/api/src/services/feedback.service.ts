import { query } from "../db";
import { SubmitFeedbackInput } from "../schemas/feedback.schema";
import { Feedback } from "@agnidrishti/shared-types";
import { NotFoundError } from "../utils/errors";

export class FeedbackService {
  /**
   * Submit human-in-the-loop analyst feedback on a classified event.
   */
  static async submitFeedback(
    eventId: string,
    input: SubmitFeedbackInput,
    userId: string
  ): Promise<Feedback> {
    // Check if event exists
    const eventRes = await query("SELECT id FROM classified_events WHERE id = $1;", [eventId]);
    if (eventRes.rows.length === 0) {
      throw new NotFoundError(`Classified event with ID ${eventId} not found`);
    }

    const res = await query<Feedback>(
      `INSERT INTO feedback (classified_event_id, user_id, corrected_label, notes, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, classified_event_id, user_id, corrected_label, notes, created_at;`,
      [eventId, userId, input.corrected_label, input.notes || null]
    );

    return res.rows[0];
  }
}

