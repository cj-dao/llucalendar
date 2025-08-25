# llucalendar
Script to transfer LLU Canvas calendar to personal calendar

# Instructions
1) In the CONFIG object, fill in the values for your calendar IDs and Life Community group + subgroup.
2) Create a Google Apps Script project
3) Add the Calendar service under "Services"
4) Paste the JavaScript file under the main branch into the "Code.gs" file, replacing any existing functions.
5) Deploy the project as a web app and provide necessary authentications.
6) In the left menu panel, create a new time-driven trigger, executing the syncCalendars function under Head deployment every 1 day during a time period of your choosing.
7) Run the script from the code panel to test.
