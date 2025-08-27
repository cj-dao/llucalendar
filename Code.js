/**
 * Configuration Block
 */
const CONFIG = {
  // ID of the calendar to copy events FROM.
  SOURCE_CALENDAR_ID: '1cmf40v4v4ctchb0u99a3382r2v17k7v@import.calendar.google.com',

  // ID of the calendar to copy events TO. Find this in the calendar's settings.
  DESTINATION_CALENDAR_ID: 'calebjonathandao@gmail.com',

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


/**
 * @description The main function to be run by the trigger.
 * This combines two methods: it gets recently updated events AND all events
 * in the upcoming 7-day window, then processes the unique combined list.
 */
function syncCalendars() {
  // 1. Define the time windows
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  const updatedMin = new Date(now.getTime() - (CONFIG.SYNC_WINDOW_HOURS * 60 * 60 * 1000)).toISOString();

  const combinedEventsMap = new Map();

  // 2. Fetch recently updated events (for efficiency and to catch deletions)
  try {
    const updatedEvents = Calendar.Events.list(CONFIG.SOURCE_CALENDAR_ID, {
      updatedMin: updatedMin,
      singleEvents: false,
      showDeleted: true,
    });
    if (updatedEvents.items) {
      updatedEvents.items.forEach(event => combinedEventsMap.set(event.id, event));
      console.log(`Found ${updatedEvents.items.length} recently updated event(s).`);
    }
  } catch (e) {
    console.error(`Could not fetch recently updated events. Error: ${e.message}`);
  }

  // 3. Fetch all events in the upcoming week (to be comprehensive)
  try {
    const upcomingEvents = Calendar.Events.list(CONFIG.SOURCE_CALENDAR_ID, {
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    if (upcomingEvents.items) {
      upcomingEvents.items.forEach(event => combinedEventsMap.set(event.id, event));
      console.log(`Found ${upcomingEvents.items.length} upcoming event(s) in the next 7 days.`);
    }
  } catch (e) {
    console.error(`Could not fetch upcoming events. Error: ${e.message}`);
  }
  
  const allEventsToProcess = Array.from(combinedEventsMap.values());

  // 4. Filter the combined list to only include events within the next 7 days
  //    An exception is made for cancelled events, which must be processed to delete their copies.
  const filteredEvents = allEventsToProcess.filter(event => {
    // ALWAYS include cancelled events so their copies can be deleted.
    if (event.status === 'cancelled') {
      return true;
    }
    // For all other events, check if their start time is within the window.
    const startTimeString = event.start.dateTime || event.start.date;
    const eventStartDate = new Date(startTimeString);
    return eventStartDate >= now && eventStartDate <= sevenDaysFromNow;
  });


  // 5. Process the final, filtered list of events
  if (filteredEvents.length === 0) {
    console.log("No relevant events to process after filtering.");
    return;
  }

  console.log(`Processing ${filteredEvents.length} unique and relevant event(s) after filtering...`);
  filteredEvents.forEach(sourceEvent => {
    processEvent(sourceEvent);
  });

  console.log("Sync complete.");
}


/**
 * @description Decides whether to create, update, or delete a copied event
 * based on the state of the source event.
 * @param {object} sourceEvent - The event object from the source calendar.
 */
function processEvent(sourceEvent) {
  const originalEventId = sourceEvent.id;

  // Find if a copy of this event already exists
  const copiedEvent = findCopiedEvent(originalEventId);

  // Case 1: The original event has been cancelled/deleted.
  if (sourceEvent.status === 'cancelled') {
    if (copiedEvent) {
      console.log(`Deleting copied event for cancelled source: "${sourceEvent.summary}"`);
      try {
        Calendar.Events.remove(CONFIG.DESTINATION_CALENDAR_ID, copiedEvent.id);
      } catch (e) {
        // May fail if already deleted, which is fine.
        console.warn(`Could not delete copied event (may have already been removed). Error: ${e.message}`);
      }
    }
    return; // Stop processing this event
  }

  // Case 2: The original event meets the criteria to be copied.
  if (eventMeetsCriteria(sourceEvent)) {
    let colorId = getColor(sourceEvent);
    if (copiedEvent) {
      // Update the existing copy
      updateCopiedEvent(sourceEvent, copiedEvent, colorId);
    } else {
      // Create a new copy
      createCopiedEvent(sourceEvent, colorId);
    }
  }
  // Case 3: The original event no longer meets the criteria.
  else {
    if (copiedEvent) {
      // If a copy exists, it should be deleted.
      console.log(`Deleting copied event for source that no longer matches criteria: "${sourceEvent.summary}"`);
      try {
        Calendar.Events.remove(CONFIG.DESTINATION_CALENDAR_ID, copiedEvent.id);
      } catch (e) {
        console.warn(`Could not delete copied event. Error: ${e.message}`);
      }
    }
  }
}

//returns a colorId based on event properties
function getColor(event) {
  let colorId = 10; //basil
  let title = event.summary ? event.summary.toLowerCase() : '';

  const ORANGE_WORDS = ['tbl', 'cbtl', 'quiz', 'chapel'];
  const RED_WORDS = ['midterm', 'evaluation', 'mandatory', 'exam'];
  const BLUE_WORDS = ['pqz', 'flipped classroom', 'panopto'];

  const isOrange = ORANGE_WORDS.some(keyword => {
    return title.includes(keyword)
  });
  const isRed = RED_WORDS.some(keyword => {
    return title.includes(keyword)
  });
  const isBlue = BLUE_WORDS.some(keyword => {
    return title.includes(keyword)
  });
  
  if(isOrange) colorId = 4; //flamingo
  if(isRed) colorId = 6; //tangerine
  if(isBlue) colorId = 9; //blueberry

  return colorId;
}


/**
 * @description Checks if an event matches the keywords defined in CONFIG.
 * @param {object} event - The calendar event object.
 * @returns {boolean} - True if the event matches the criteria.
 */
function eventMeetsCriteria(event) {
  const title = event.summary ? event.summary.toLowerCase() : '';
  const description = event.description ? event.description.toLowerCase() : '';
  const location = event.location ? event.location.toLowerCase() : '';

  const hasKeyword = CONFIG.KEYWORDS.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    return title.includes(lowerKeyword) || description.includes(lowerKeyword);
  });

  

  const hasGroupNum = containsLifeGroup(title);

  const hasClass = pertainsClass(title);

  const hasLocationKeyword = CONFIG.LOCATION_KEYWORDS.some(keyword => {
    return location.includes(keyword.toLowerCase());
  });

  const hasMandKeyword = CONFIG.MANDATORY_KEYWORDS.some(keyword => {
    return title.includes(keyword.toLowerCase())
  });

  //return (hasKeyword && hasGroupNum) || (hasLocationKeyword && !hasKeyword) || (hasMandKeyword && !hasKeyword);
  return ((!hasKeyword) || (hasKeyword && hasGroupNum)) && hasClass;
}


/**
 * @description Finds an event in the destination calendar that was copied from a specific source event.
 * @param {string} originalEventId - The ID of the source event.
 * @returns {object|null} - The copied event object or null if not found.
 */
function findCopiedEvent(originalEventId) {
  try {
    const query = `${CONFIG.COPIED_EVENT_TAG}=${originalEventId}`;
    const existingEvents = Calendar.Events.list(CONFIG.DESTINATION_CALENDAR_ID, {
      privateExtendedProperty: query,
    });

    if (existingEvents.items && existingEvents.items.length > 0) {
      return existingEvents.items[0]; // Return the first match
    }
    return null;
  } catch (e) {
    console.error(`Error finding copied event for source ID ${originalEventId}: ${e.message}`);
    return null;
  }
}


/**
 * @description Creates a new event in the destination calendar.
 * @param {object} sourceEvent - The source event to copy.
 */
function createCopiedEvent(sourceEvent, colorId) {
  console.log(`Copying new event: "${sourceEvent.summary}"`);
  const newEvent = {
    summary: sourceEvent.summary,
    description: sourceEvent.description,
    location: sourceEvent.location,
    start: sourceEvent.start,
    end: sourceEvent.end,
    colorId: colorId,
    // Link the new event to the original event using a hidden property
    extendedProperties: {
      private: {
        [CONFIG.COPIED_EVENT_TAG]: sourceEvent.id
      }
    }
  };

  try {
    Calendar.Events.insert(newEvent, CONFIG.DESTINATION_CALENDAR_ID);
  } catch (e) {
    console.error(`Failed to create event "${sourceEvent.summary}". Error: ${e.message}`);
  }
}


/**
 * @description Updates an existing event in the destination calendar.
 * @param {object} sourceEvent - The updated source event.
 * @param {object} copiedEvent - The existing copy to update.
 */
function updateCopiedEvent(sourceEvent, copiedEvent, colorId) {
  console.log(`Updating copied event: "${sourceEvent.summary}"`);
  const payload = {
    summary: sourceEvent.summary,
    description: sourceEvent.description,
    location: sourceEvent.location,
    start: sourceEvent.start,
    end: sourceEvent.end,
    colorId: colorId,
    // Ensure the link to the original event is maintained
    extendedProperties: copiedEvent.extendedProperties
  };

  try {
    Calendar.Events.update(payload, CONFIG.DESTINATION_CALENDAR_ID, copiedEvent.id);
  } catch (e) {
    console.error(`Failed to update event "${sourceEvent.summary}". Error: ${e.message}`);
  }
}

function containsLifeGroup(title) {
  // 1. Use a regular expression with the global flag 'g' to find ALL instances of 'Groups...'.
  // The 'i' flag makes the search case-insensitive.
  const matches = title.matchAll(/Groups\s+([^:;\[\](){}]+)/gi);

  if(title.toLowerCase().indexOf('Group '+CONFIG.GROUP_NUM) != -1) {
    return true;
  }

  // 2. Iterate over each match found in the title. Each 'match' is a separate group list.
  for (const match of matches) {
    // 3. If a match is found and has a captured group...
    if (match && match[1]) {
      // 4. The captured group list is in match[1]. Split it by commas.
      const groups = match[1].split(',');

      // 5. Iterate over each potential group string in the current list.
      for (const group of groups) {
        // Trim whitespace from the beginning and end of the string.
        const trimmedGroup = group.trim();

        // 6. Check if the group is a range (e.g., "16-20").
        if (trimmedGroup.includes('-')) {
          // Split the range into start and end parts, and convert them to integers.
          const [start, end] = trimmedGroup.split('-').map(num => parseInt(num, 10));

          // Check if 17 is within the inclusive range.
          if (!isNaN(start) && !isNaN(end) && CONFIG.GROUP_NUM >= start && CONFIG.GROUP_NUM <= end) {
            return true; // Found in a range, return true immediately.
          }
        } else {
          // 7. If it's not a range, handle single groups.
          // The rule is to match only "17" (without letters) or "17A".
          if (trimmedGroup === (''+CONFIG.GROUP_NUM) || trimmedGroup === ('' + CONFIG.GROUP_NUM + CONFIG.SUBGROUP) || trimmedGroup === (CONFIG.GROUP_NUM + 'ab')) {
            return true; // Found a matching group, return true immediately.
          }
        }
      }
    }
  }

  // 8. If all loops complete without finding any match in any of the group lists, return false.
  return false;
}

function containsLifeGroupOld(title) {
  // 1. Use a regular expression to find the string 'Groups' followed by any characters until a colon.
  // The expression captures the list of groups between 'Groups ' and ':'.
  // The 'i' flag makes the search for 'Groups' case-insensitive.
  const match = title.match(/Groups\s+([^:\[\](){}]+)/i);

  if(title.toLowerCase().indexOf('Group '+CONFIG.GROUP_NUM) != -1) {
    return true;
  }

  // 2. If the pattern is not found, 'match' will be null. In this case, we can immediately return false.
  if (!match || !match[1]) {
    return false;
  }

  // 3. The captured group list is in match[1]. We split it by commas to get an array of individual group strings.
  const groups = match[1].split(',');

  // 4. Iterate over each potential group string in the array.
  for (const group of groups) {
    // Trim whitespace from the beginning and end of the string.
    const trimmedGroup = group.trim();

    // 5. Check if the group is a range (e.g., "16-20").
    if (trimmedGroup.includes('-')) {
      // Split the range into start and end parts, and convert them to integers.
      const [start, end] = trimmedGroup.split('-').map(num => parseInt(num, 10));

      // Check if group # is within the inclusive range.
      // We also check if start and end are valid numbers.
      if (!isNaN(start) && !isNaN(end) && CONFIG.GROUP_NUM >= start && CONFIG.GROUP_NUM <= end) {
        return true; // Found a matching range, return true immediately.
      }
    } else {
      // 6. If it's not a range, handle single groups.
      
      if (trimmedGroup === (''+CONFIG.GROUP_NUM) || trimmedGroup === ('' + CONFIG.GROUP_NUM + CONFIG.SUBGROUP) || trimmedGroup === (CONFIG.GROUP_NUM + 'ab')) {
        return true; // Found a matching group, return true immediately.
      }
    }
  }

  // 7. If the loop completes without finding any match for life group, return false.
  return false;
}

function pertainsClass(title) {
  // The regular expression \b is a "word boundary". It matches a position
  // where a word character (like a letter or number) is not followed or
  // preceded by another word character. This is perfect for finding "m1"
  // or "m2" as standalone words, matching cases like " m1 ", "(m1)", or "m1."
  // but not "problem1".
  const m1Regex = /\bm1\b/;
  const m2Regex = /\bm2\b/;

  // Rule 1: If M1 is found, always return true.
  // The .test() method checks for a match and is very efficient.
  if (m1Regex.test(title)) {
    return true;
  }

  // Rule 2: If M1 was not found, check for M2. If M2 is found, return false.
  if (m2Regex.test(title)) {
    return false;
  }

  // Rule 3: If neither M1 nor M2 was found, return true.
  return true;
}




