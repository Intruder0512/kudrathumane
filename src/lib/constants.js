// Every option list in one place, as [value, label].
export const DOG_STATUS = [
  ['rescued', 'Rescued'],
  ['under_assessment', 'Under assessment'],
  ['under_treatment', 'Under treatment'],
  ['recovering', 'Recovering'],
  ['ready', 'Ready for adoption / foster'],
  ['adopted', 'Adopted'],
  ['fostered', 'Fostered'],
  ['released', 'Released'],
  ['deceased', 'Passed away'],
];
export const IN_CARE = ['rescued', 'under_assessment', 'under_treatment', 'recovering', 'ready'];
export const SEX = [['male', 'Male'], ['female', 'Female']];
export const SPAY = [['done', 'Spayed / neutered'], ['not_yet', 'Not yet'], ['scheduled', 'Scheduled'], ['waived', 'Waived']];
export const RESCUE_TYPE = [
  ['road_accident', 'Road accident'],
  ['abuse_case', 'Abuse case'],
  ['abandoned', 'Abandoned'],
  ['stray_illness', 'Stray illness'],
  ['other', 'Other'],
];
export const CONDITION = [['critical', 'Critical'], ['serious', 'Serious'], ['stable', 'Stable'], ['healthy', 'Healthy']];
export const VACCINES = [
  ['Anti-rabies', 12], ['DHPPiL (7-in-1)', 12], ['Distemper', 12], ['Parvovirus', 12],
  ['Leptospirosis', 12], ['Bordetella (kennel cough)', 12], ['Coronavirus', 12],
];
export const FREQUENCY = [['daily', 'Daily'], ['twice_daily', 'Twice daily'], ['weekly', 'Weekly'], ['as_needed', 'As needed']];
export const OUTCOME = [['ongoing', 'Ongoing'], ['recovered', 'Recovered'], ['referred', 'Referred'], ['deceased', 'Deceased']];
export const DEWORM_KIND = [['deworming', 'Deworming'], ['tick_flea', 'Tick / flea']];
export const RELEASE_TYPE = [
  ['virtual_adoption', 'Virtual adoption (stays at shelter)'],
  ['physical_foster', 'Physical foster'],
  ['permanent_adoption', 'Permanent adoption'],
  ['return_to_street', 'Return to street (post-TNR)'],
  ['transfer', 'Transfer to another facility'],
];
export const ADOPTION_STATUS = [['pending', 'Awaiting payment check'], ['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
export const PAYMENT_STATUS = [['pending', 'Pending'], ['completed', 'Completed'], ['failed', 'Failed']];
export const PAYMENT_METHOD = [['upi', 'UPI'], ['bank_transfer', 'Bank transfer'], ['cash', 'Cash'], ['cheque', 'Cheque'], ['card', 'Card'], ['other', 'Other']];
export const PURPOSE = [['virtual_adoption', 'Virtual adoption'], ['donation', 'Donation']];
export const SUPPLY_CATEGORY = [
  ['food', 'Food'], ['medicine', 'Medicine'], ['medical_supplies', 'Medical supplies'], ['bedding', 'Bedding'],
  ['toys', 'Toys'], ['grooming', 'Grooming'], ['equipment', 'Equipment'], ['other', 'Other'],
];
export const UNITS = [['kg', 'kg'], ['litres', 'litres'], ['packets', 'packets'], ['boxes', 'boxes'], ['bottles', 'bottles'], ['strips', 'strips'], ['pieces', 'pieces']];
export const MOVEMENT_REASON = [['received', 'Received / bought'], ['used', 'Used'], ['donated_in', 'Donated in'], ['expired', 'Expired / wasted'], ['correction', 'Stock correction']];
export const VOLUNTEER_STATUS = [['new', 'New'], ['active', 'Active'], ['inactive', 'Inactive']];
export const APPLICATION_STATUS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']];
export const PLACEMENT_STATUS = [['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
export const MOOD = [['playful', 'Playful'], ['calm', 'Calm'], ['energetic', 'Energetic'], ['tired', 'Tired'], ['unwell', 'Unwell']];
export const LF_KIND = [['lost', 'Lost'], ['found', 'Found']];
export const LF_STATUS = [['open', 'Open'], ['matched', 'Matched'], ['reunited', 'Reunited'], ['in_shelter', 'In our shelter'], ['closed', 'Closed']];
export const ROLES = [['admin', 'Admin'], ['volunteer', 'Volunteer'], ['foster', 'Foster family'], ['supporter', 'Supporter']];
export const MICROCHIP_BRANDS = [['', '—'], ['Petlink', 'Petlink'], ['HomeAgain', 'HomeAgain'], ['Avid', 'Avid'], ['Other', 'Other']];

export const label = (list, value) => list.find(([v]) => v === value)?.[1] ?? value ?? '—';
