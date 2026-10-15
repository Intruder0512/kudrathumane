/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("dogs");

  const record0 = new Record(collection);
    record0.set("name", "Simba");
    record0.set("breed", "Indie/Mixed");
    record0.set("age", 3);
    record0.set("sex", "Male");
    record0.set("rescued_from_area", "Mumbai streets");
    record0.set("status", "Available");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("name", "Golu");
    record1.set("breed", "Indie/Mixed");
    record1.set("age", 2);
    record1.set("sex", "Male");
    record1.set("rescued_from_area", "Delhi");
    record1.set("status", "Available");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("name", "Moti");
    record2.set("breed", "Indie/Mixed");
    record2.set("age", 4);
    record2.set("sex", "Female");
    record2.set("rescued_from_area", "Bangalore");
    record2.set("status", "Available");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("name", "Bholu");
    record3.set("breed", "Indie/Mixed");
    record3.set("age", 1.5);
    record3.set("sex", "Male");
    record3.set("rescued_from_area", "Pune");
    record3.set("status", "Available");
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("name", "Shera");
    record4.set("breed", "Indie/Mixed");
    record4.set("age", 5);
    record4.set("sex", "Male");
    record4.set("rescued_from_area", "Kolkata");
    record4.set("status", "Available");
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("name", "Kalu");
    record5.set("breed", "Indie/Mixed");
    record5.set("age", 2.5);
    record5.set("sex", "Female");
    record5.set("rescued_from_area", "Hyderabad");
    record5.set("status", "Available");
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})