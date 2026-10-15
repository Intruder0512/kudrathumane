/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rescues");

  const existing = collection.fields.getByName("condition_when_found");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("condition_when_found"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "condition_when_found",
    required: false,
    values: ["critical", "serious", "stable", "healthy"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("rescues");
    collection.fields.removeByName("condition_when_found");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})