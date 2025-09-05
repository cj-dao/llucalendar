# llucalendar
Google Apps Script to transfer LLU Canvas calendar to personal calendar, color-coding and filtering events pertaining to your life community.

# DISCLAIMER
The script may errantly miss events or otherwise fail to properly reflect your schedule. Please check calendar for accuracy and report any issues as they appear. I am not responsible for any missed quizzes or exams!

# Instructions
1) Create a Google Apps Script project.
2) Add the Calendar service under "Services."
3) Copy and paste the code from Code.gs in github into the same file in Apps Script, replacing existing text.
4) Add a file under "Files" and name it "Config", then paste the code from Config.gs.
5) In the Config file, fill in the values for your calendar IDs and Life Community group + subgroup.
6) Deploy the project as a web app.
7) In the left menu panel, create a new time-driven trigger, executing the syncCalendars function under Head deployment every 1 day during a time period of your choosing.
8) Run the script from the code panel to test, ensuring that the syncCalendars function is selected to execute, and allowing any necessary authorizations.
9) Ask AI for help if you run into any problems.

# Optional instructions
-Change the number of future days the script will modify

-Modify the getColor() function to customize color-coding
