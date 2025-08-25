# llucalendar
Script to transfer LLU Canvas calendar to personal calendar, color-coding and filtering events pertaining to your life community.

# DISCLAIMER
The script may errantly miss events or otherwise fail to properly reflect your schedule. Please check calendar for accuracy and report any issues as they appear. I am not responsible for any missed quizzes or exams!

# Instructions
1) In the CONFIG object, fill in the values for your calendar IDs and Life Community group + subgroup.
2) Create a Google Apps Script project
3) Add the Calendar service under "Services"
4) Paste the JavaScript file under the main branch into the "Code.gs" file, replacing any existing functions.
5) Deploy the project as a web app and provide necessary authentications.
6) In the left menu panel, create a new time-driven trigger, executing the syncCalendars function under Head deployment every 1 day during a time period of your choosing.
7) Run the script from the code panel to test, ensuring that the syncCalendars function is selected to execute.

# Optional instructions
-Change the number of future days the script will modify
-Modify the getColor() function to customize color-coding.
