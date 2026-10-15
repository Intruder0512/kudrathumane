/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let records;
  try {
    records = app.findRecordsByFilter("users", "email='admin@kudrathumane.org'");
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("No records found, skipping");
      return;
    }
    throw e;
  }
  
  for (const record of records) {
    record.set("role", "admin");
    app.save(record);
  }
}, (app) => {
  // Rollback: original values not stored, manual restore needed
})