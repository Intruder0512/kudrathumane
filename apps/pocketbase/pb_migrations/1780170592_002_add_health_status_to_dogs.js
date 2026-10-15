/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("dogs");

  const existing = collection.fields.getByName("health_status");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("health_status"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "health_status",
    required: true,
    values: ["rescued", "under assessment", "under treatment", "recovering", "ready for adoption", "adopted", "fostered"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("dogs");
    collection.fields.removeByName("health_status");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})