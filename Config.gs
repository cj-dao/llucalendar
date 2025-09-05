/**
 * Configuration Block
 */
const CONFIG = {
  // ID of the calendar to copy events FROM.
  SOURCE_CALENDAR_ID: 'INSERT LLU CALENDAR ID',

  // ID of the calendar to copy events TO. Find this in the calendar's settings.
  DESTINATION_CALENDAR_ID: 'INSERT PERSONAL CALENDAR ID',

  //Life group #
  GROUP_NUM: 00,

  //Life subgroup (A or B)
  SUBGROUP: 'A'.toLowerCase(),
  
  // Keywords denoting Group events
  KEYWORDS: ['Group'],

  // Keywords to look for in the event LOCATION.
  // Example: ['Conference Room A', 'HQ Office']
  LOCATION_KEYWORDS: ['Carroll'],

  //Events will always be included
  MANDATORY_KEYWORDS: ['Midterm', 'Chapel', 'SEQ', 'MCQ', 'Quiz'],

  // The key used to store the original event's ID. You shouldn't need to change this.
  COPIED_EVENT_TAG: 'sourceEventId',

  SYNC_WINDOW_HOURS: 24
};
