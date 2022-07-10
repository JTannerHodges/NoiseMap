# NoiseMap
Conceptual web application created for monitoring noise pollution in near real-time using user uploaded files.

# Requirements
- A web browser, such as Firefox, Google Chrome, Safari, or Microsoft Edge.
- One audio file between 30-45 seconds in length with minimal wind distortion. (30 second minimum to lessen skewing of average stemming from potential spikes in loudness.)

# Install
- No installation is required. Simply follow this URL: https://noisemap.pythonanywhere.com

# Testing
- Complete all forms and upload sound files contained in 'TEST_soundfiles' folder.
- Select submit button. Your data should display on the map with an icon corresponding to the average dBFS value.
- Select the icon to view the table containing your data.
- Expected outcome: Icon and accompanying table should display at location selected by user.
- Expected dBFS values for each file:
	- Red: -21.3
	- Yellow: -44.6
	- Green: -66.8
