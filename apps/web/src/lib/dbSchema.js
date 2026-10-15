// Generated from the PocketBase migrations: table columns and file fields.
// Keep in sync with supabase/schema.sql.
export const TABLES = {
  "dogs": {
    "columns": [
      "id",
      "name",
      "breed",
      "age",
      "sex",
      "rescued_from_area",
      "photo",
      "status",
      "health_status",
      "spay_neuter_status",
      "spay_neuter_date",
      "operating_vet",
      "created",
      "updated"
    ],
    "files": {
      "photo": "single"
    }
  },
  "virtual_adoptions": {
    "columns": [
      "id",
      "user_id",
      "dog_id",
      "monthly_amount",
      "payment_status",
      "adoption_date",
      "created",
      "updated"
    ],
    "files": {}
  },
  "payments": {
    "columns": [
      "id",
      "adoption_id",
      "amount",
      "payment_date",
      "payment_method",
      "status",
      "created",
      "updated"
    ],
    "files": {}
  },
  "qr_code": {
    "columns": [
      "id",
      "image",
      "uploaded_date",
      "updated_date",
      "created",
      "updated"
    ],
    "files": {
      "image": "single"
    }
  },
  "rescues": {
    "columns": [
      "id",
      "dog_id",
      "rescue_date",
      "rescue_location",
      "rescue_type",
      "rescued_by",
      "intake_condition",
      "intake_photos",
      "initial_notes",
      "location_coordinates",
      "dog_name",
      "dog_description",
      "condition_when_found",
      "created",
      "updated"
    ],
    "files": {
      "intake_photos": "multi"
    }
  },
  "vaccinations": {
    "columns": [
      "id",
      "dog_id",
      "vaccine_name",
      "date_administered",
      "next_due_date",
      "administered_by",
      "batch_number",
      "status",
      "created",
      "updated"
    ],
    "files": {}
  },
  "treatments": {
    "columns": [
      "id",
      "dog_id",
      "condition",
      "start_date",
      "treatment_plan",
      "medications",
      "frequency",
      "vet_name",
      "progress_notes",
      "end_date",
      "outcome",
      "created",
      "updated"
    ],
    "files": {}
  },
  "deworming": {
    "columns": [
      "id",
      "dog_id",
      "deworming_date",
      "next_due_date",
      "medication",
      "administered_by",
      "dosage",
      "notes",
      "created",
      "updated"
    ],
    "files": {}
  },
  "release_checklist": {
    "columns": [
      "id",
      "dog_id",
      "vaccinations_complete",
      "treatment_complete",
      "spay_neuter_done",
      "behaviour_assessment",
      "microchipping",
      "follow_up_plan",
      "release_type",
      "release_date",
      "released_to",
      "post_release_contact",
      "created",
      "updated"
    ],
    "files": {}
  },
  "in_kind_donations": {
    "columns": [
      "id",
      "donor_name",
      "donation_date",
      "donation_type",
      "item_description",
      "quantity",
      "unit",
      "estimated_value",
      "donor_contact",
      "notes",
      "created",
      "updated"
    ],
    "files": {}
  },
  "volunteers": {
    "columns": [
      "id",
      "name",
      "email",
      "phone",
      "location",
      "experience_level",
      "availability",
      "hours_worked",
      "tasks_completed",
      "created",
      "updated"
    ],
    "files": {}
  },
  "inventory": {
    "columns": [
      "id",
      "name",
      "category",
      "quantity",
      "unit",
      "reorder_level",
      "last_updated",
      "created",
      "updated"
    ],
    "files": {}
  },
  "inventory_usage": {
    "columns": [
      "id",
      "item_id",
      "quantity_used",
      "date",
      "used_for",
      "notes",
      "created",
      "updated"
    ],
    "files": {}
  },
  "microchips": {
    "columns": [
      "id",
      "dog_id",
      "microchip_number",
      "brand",
      "implant_date",
      "implant_vet",
      "created",
      "updated"
    ],
    "files": {}
  },
  "foster_families": {
    "columns": [
      "id",
      "name",
      "contact_person",
      "email",
      "phone",
      "address",
      "experience_level",
      "max_dogs",
      "current_dogs",
      "availability",
      "notes",
      "created",
      "updated"
    ],
    "files": {}
  },
  "foster_placements": {
    "columns": [
      "id",
      "foster_id",
      "dog_id",
      "assignment_date",
      "expected_return_date",
      "actual_return_date",
      "special_care_instructions",
      "status",
      "created",
      "updated"
    ],
    "files": {}
  },
  "foster_updates": {
    "columns": [
      "id",
      "placement_id",
      "date",
      "weight",
      "health_notes",
      "behavior_notes",
      "photos",
      "mood_level",
      "created_by",
      "created",
      "updated"
    ],
    "files": {
      "photos": "multi"
    }
  },
  "lost_found_reports": {
    "columns": [
      "id",
      "type",
      "dog_description",
      "location",
      "date_reported",
      "photos",
      "reporter_name",
      "reporter_contact",
      "reward_offered",
      "status",
      "matched_with_id",
      "notes",
      "created",
      "updated"
    ],
    "files": {
      "photos": "multi"
    }
  },
  "adoption_certificates": {
    "columns": [
      "id",
      "adopter_name",
      "dog_id",
      "adoption_date",
      "certificate_date",
      "certificate_pdf_url",
      "custom_message",
      "status",
      "sent_date",
      "created",
      "updated"
    ],
    "files": {}
  },
  "social_media_content": {
    "columns": [
      "id",
      "dog_id",
      "story_type",
      "tone",
      "story_text",
      "instagram_caption",
      "facebook_post",
      "twitter_post",
      "image_url",
      "status",
      "platform",
      "created",
      "updated"
    ],
    "files": {}
  },
  "adoptions": {
    "columns": [
      "id",
      "dog_id",
      "adopter_name",
      "adopter_email",
      "adopter_phone",
      "adopter_address",
      "adoption_date",
      "adoption_type",
      "adoption_fee",
      "follow_up_date",
      "notes",
      "created",
      "updated"
    ],
    "files": {}
  },
  "certificates": {
    "columns": [
      "id",
      "adopter_name",
      "dog_id",
      "adoption_date",
      "custom_message",
      "pdf_data",
      "created_at",
      "sent_to_email",
      "sent_at",
      "created",
      "updated"
    ],
    "files": {}
  }
};
